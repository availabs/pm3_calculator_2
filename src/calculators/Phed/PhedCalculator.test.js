/* eslint no-param-reassign: 0, global-require: 0 */

const assert = require('assert');
const { range, shuffle, sum } = require('lodash');
const { query, end } = require('../../storage/services/DBService');

const { getMetadataForTmcs } = require('../../storage/daos/TmcMetadataDao');
const {
  getBinnedYearNpmrdsDataForTmc
} = require('../../storage/daos/NpmrdsDataDao');

const NpmrdsDataEnricher = require('../../utils/NpmrdsDataEnricher');
const { precisionRound } = require('../../utils/MathUtils');
const {
  getNumBinsInDayForTimeBinSize,
  getDaylightSavingsStartDateForYear
} = require('../../utils/TimeUtils');
const { IDENTITY } = require('../../enums/outputFormats');
const { FREEWAY } = require('../../enums/functionalClasses');

const TMC = '104+04107';
const YEAR = 2017;
const TWO_AM_MINS = 120;
const THREE_AM_MINS = 180;

const CLOSENESS_PRECISION = 9;

const SIX_AM = 6;
const TEN_AM = 10;
const THREE_PM = 15;
const SEVEN_PM = 19;
const DAYS_PER_WEEK = 7;

const timeBinSizes = [5, 15, 60];

beforeEach(() => {
  jest.resetModules();
});

describe.each(timeBinSizes)('Time Bin Size %d', timeBinSize => {
  test(`PHED excess delay hours`, async done => {
    const sql = `
      SELECT
          tmc,
          COUNT(1),
          SUM(xdelay_hrs) AS total_xdelay
        FROM (
          SELECT
              tmc,
              ROUND(
                rsd::NUMERIC
                /
                3600::NUMERIC,
                3
              )::NUMERIC AS xdelay_hrs
            FROM (
              SELECT
                  tmc,
                  ROUND(
                    LEAST(
                      (avg_tt::NUMERIC - threshold_tt::NUMERIC)::NUMERIC,
                      (${timeBinSize} * 60)::NUMERIC
                    )::NUMERIC
                  ) AS rsd
                FROM (
                  SELECT
                      tmc,
                      ROUND(
                        AVG(travel_time_all_vehicles::NUMERIC)
                      ) AS avg_tt
                    FROM ny.npmrds
                  WHERE (
                    (tmc = '${TMC}')
                    AND
                    (date >= '20170101')
                    AND
                    (date < '20180101')
                    AND
                    (
                      (epoch BETWEEN (${SIX_AM} * 12) AND ((${TEN_AM} * 12) - 1))
                      OR
                      (epoch BETWEEN (${THREE_PM} * 12) AND ((${SEVEN_PM} * 12) - 1))
                    )
                    AND
                    ( EXTRACT(DOW FROM date) BETWEEN 1 AND 5 )
                  )
                  GROUP BY tmc, date, FLOOR(epoch / (${timeBinSize} / 5))
                ) AS t1 INNER JOIN (
                  SELECT
                      tmc,
                      ROUND(
                        (
                          ROUND(miles::NUMERIC, 3)::NUMERIC
                          /
                          GREATEST(
                            0.6::NUMERIC * avg_speedlimit::NUMERIC,
                            20
                          )::NUMERIC
                        )::NUMERIC * 3600
                      )::NUMERIC threshold_tt
                    FROM ny.tmc_metadata_2017
                    WHERE ( tmc = '${TMC}' )
                ) AS t2 USING (tmc)
            ) AS t3
        ) AS t4
        WHERE xdelay_hrs > 0
        GROUP BY tmc
      ;
    `;

    const { rows } = await query(sql);
    const [{ total_xdelay: expectedXdelayHrs }] = rows;

    const PhedCalculator = require('./PhedCalculator');

    const phedCalculator = new PhedCalculator({
      year: YEAR,
      timeBinSize,
      outputFormat: IDENTITY
    });

    const { requiredTmcMetadata } = phedCalculator;
    const [attrs] = await getMetadataForTmcs({
      year: YEAR,
      tmcs: TMC,
      columns: requiredTmcMetadata
    });

    const { npmrdsDataKeys } = phedCalculator;

    const data = await getBinnedYearNpmrdsDataForTmc({
      year: YEAR,
      timeBinSize,
      tmc: TMC,
      state: attrs.state,
      npmrdsDataKeys
    });

    NpmrdsDataEnricher.enrichData({ year: YEAR, timeBinSize, data });

    const result = await phedCalculator.calculateForTmc({ data, attrs });

    expect(result.xdelayHrs).toBeCloseTo(
      +expectedXdelayHrs,
      CLOSENESS_PRECISION
    );

    done();
  });
});

const generateMockData = ({ timeBinSize, tmc }) => {
  const { month: dlsMonth, date: dlsDate } = getDaylightSavingsStartDateForYear(
    YEAR
  );

  const dlsStartTimeBinNum = TWO_AM_MINS / timeBinSize;

  const curTime = new Date(`${YEAR}-01-01 00:00:00`);
  const endTime = new Date(`${YEAR + 1}-01-01 00:00:00`);

  const mockNpmrdsData = [];

  while (curTime < endTime) {
    const yyyy = curTime.getFullYear();
    const mm = `0${curTime.getMonth() + 1}`.slice(-2);
    const dd = `0${curTime.getDate()}`.slice(-2);

    const date = `${yyyy}-${mm}-${dd}`;

    const isDLSStartDate = dlsMonth === +mm && dlsDate === +dd;

    for (
      let timeBinNum = 0;
      curTime.getDate() === +dd;
      ++timeBinNum, curTime.setMinutes(curTime.getMinutes() + timeBinSize)
    ) {
      if (isDLSStartDate && timeBinNum === dlsStartTimeBinNum) {
        timeBinNum = THREE_AM_MINS / timeBinSize;
      }

      const curDow = curTime.getDay();
      const curHour = curTime.getHours();

      mockNpmrdsData.push({
        tmc,
        date,
        timeBinNum,
        dow: curDow,
        hour: curHour
      });
    }
  }

  return shuffle(mockNpmrdsData);
};

const generateMockTrafficDistProfile = timeBinSize => {
  const binsPerDay = getNumBinsInDayForTimeBinSize(timeBinSize);

  return range(DAYS_PER_WEEK).reduce((dAcc, dow) => {
    const randomRatios = range(binsPerDay).map(() => Math.random());
    const sumOfRatios = sum(randomRatios);
    const mockFractionsOfDailyAadt = randomRatios.map(r => r / sumOfRatios);

    dAcc[dow] = mockFractionsOfDailyAadt;

    return dAcc;
  }, {});
};

describe.each(timeBinSizes)('Time Bin Size %d', timeBinSize => {
  test(`PHED excess delay vehicle hours`, async done => {
    const attrs = {
      tmc: 'foobar',
      miles: 2,
      avgSpeedlimit: 50,
      functionalClass: FREEWAY,
      directionalAadt: 1123,
      avgVehicleOccupancy: Math.PI
    };

    const mockTrafficDistProfile = generateMockTrafficDistProfile(timeBinSize);

    jest.doMock('../../storage/daos/TrafficDistributionProfilesDao', () => ({
      getFractionOfDailyAadtByDowByTimeBin: jest.fn(
        () => mockTrafficDistProfile
      )
    }));

    const PhedCalculator = require('./PhedCalculator');

    const thresholdTravelTimeSec = precisionRound(
      (attrs.miles / Math.max(attrs.avgSpeedlimit * 0.6, 20)) * 3600
    );

    assert(Number.isSafeInteger(thresholdTravelTimeSec));

    const phedCalculator = new PhedCalculator({
      year: YEAR,
      timeBinSize,
      outputFormat: IDENTITY
    });

    const [npmrdsDataKey] = phedCalculator.npmrdsDataKeys;

    const data = generateMockData({ tmc: attrs.tmc, timeBinSize });

    let expectedXdelayHrs = 0;
    let expectedXdelayVehHrs = 0;

    data.forEach(row => {
      const { timeBinNum, dow, hour } = row;

      const isPeak =
        dow % 6 &&
        ((hour >= SIX_AM && hour < TEN_AM) ||
          (hour >= THREE_PM && hour < SEVEN_PM));

      if (isPeak) {
        if (Math.random() > 0.5) {
          const delaySecs = Math.random() * 1000;
          const tt = thresholdTravelTimeSec + delaySecs;

          const delayHrs = precisionRound(
            Math.min(
              precisionRound(tt - thresholdTravelTimeSec),
              timeBinSize * 60
            ) / 3600,
            3
          );

          expectedXdelayHrs += delayHrs;

          const fractionOfDailyAadt = mockTrafficDistProfile[dow][timeBinNum];

          const vehicleVolume = precisionRound(
            attrs.directionalAadt * fractionOfDailyAadt,
            1
          );

          expectedXdelayVehHrs += delayHrs * vehicleVolume;

          row[npmrdsDataKey] = tt;
        } else {
          row[npmrdsDataKey] = (thresholdTravelTimeSec - 10) * Math.random();
        }
      } else {
        row[npmrdsDataKey] =
          thresholdTravelTimeSec * Math.random() +
          thresholdTravelTimeSec * Math.random();
      }
    });

    const expectedXdelayPerHrs = precisionRound(
      expectedXdelayVehHrs * attrs.avgVehicleOccupancy,
      3
    );

    expectedXdelayVehHrs = precisionRound(expectedXdelayVehHrs, 3);

    const result = await phedCalculator.calculateForTmc({ data, attrs });

    expect(result.thresholdTravelTimeSec).toEqual(thresholdTravelTimeSec);
    expect(result.xdelayHrs).toBeCloseTo(
      expectedXdelayHrs,
      CLOSENESS_PRECISION
    );

    expect(result.xdelayVehHrsByVehClass.all).toBeCloseTo(
      expectedXdelayVehHrs,
      CLOSENESS_PRECISION
    );

    expect(result.xdelayPerHrsByVehClass.all).toBeCloseTo(
      expectedXdelayPerHrs,
      CLOSENESS_PRECISION
    );

    done();
  });
});

afterAll(async done => {
  await end();
  done();
});
