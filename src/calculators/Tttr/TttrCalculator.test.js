/* eslint no-param-reassign: 0 */

const assert = require('assert');
const { get, shuffle } = require('lodash');
const { query, end } = require('../../storage/services/DBService');

const { getMetadataForTmcs } = require('../../storage/daos/TmcMetadataDao');
const {
  getBinnedYearNpmrdsDataForTmc
} = require('../../storage/daos/NpmrdsDataDao');

const NpmrdsDataEnricher = require('../../utils/NpmrdsDataEnricher');
const { precisionRound } = require('../../utils/MathUtils');
const { getDaylightSavingsStartDateForYear } = require('../../utils/TimeUtils');
const { IDENTITY } = require('../../enums/outputFormats');
const { FREEWAY } = require('../../enums/functionalClasses');
const { AMP, MIDD, PMP, WE, OVN } = require('../../enums/pm3TimePeriods');

const TttrCalculator = require('./TttrCalculator');

const YEAR = 2017;
const TWO_AM_MINS = 120;
const THREE_AM_MINS = 180;

const CLOSENESS_PRECISION = 9;

const timeBinSizes = [5, 15, 60];

describe.each(timeBinSizes)('Time Bin Size %d', timeBinSize => {
  test(`TTTR excess delay hours`, async done => {
    const attrs = {
      tmc: '000000000',
      miles: 2,
      avgSpeedlimit: 50,
      functionalClass: FREEWAY,
      avgVehicleOccupancy: 3
    };

    const thresholdTravelTimeSec = precisionRound(
      (attrs.miles / Math.max(attrs.avgSpeedlimit * 0.6, 20)) * 3600
    );

    assert(Number.isSafeInteger(thresholdTravelTimeSec));

    const tttrCalculator = new TttrCalculator({
      year: YEAR,
      timeBinSize,
      outputFormat: IDENTITY
    });

    const [npmrdsDataKey] = tttrCalculator.npmrdsDataKeys;

    const {
      month: dlsMonth,
      date: dlsDate
    } = getDaylightSavingsStartDateForYear(YEAR);

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
          tmc: '000000000',
          date,
          timeBinNum,
          dow: curDow,
          hour: curHour
        });
      }
    }

    const data = shuffle(mockNpmrdsData);
    const ttsByTimePeriod = {};

    data.forEach(row => {
      const { dow, hour } = row;

      if (hour >= 6 && hour < 20) {
        if (dow % 6) {
          if (hour >= 6 && hour < 10) {
            ttsByTimePeriod[AMP] = ttsByTimePeriod[AMP] || [];
            const v = ttsByTimePeriod[AMP].length + 1;
            ttsByTimePeriod[AMP].push(v);
            row[npmrdsDataKey] = v;
          } else if (hour >= 10 && hour < 16) {
            ttsByTimePeriod[MIDD] = ttsByTimePeriod[MIDD] || [];
            const v = ttsByTimePeriod[MIDD].length + 1;
            ttsByTimePeriod[MIDD].push(v);
            row[npmrdsDataKey] = v;
          } else if (hour >= 16 && hour < 20) {
            ttsByTimePeriod[PMP] = ttsByTimePeriod[PMP] || [];
            const v = ttsByTimePeriod[PMP].length + 1;
            ttsByTimePeriod[PMP].push(v);
            row[npmrdsDataKey] = v;
          }
        } else {
          ttsByTimePeriod[WE] = ttsByTimePeriod[WE] || [];
          const v = ttsByTimePeriod[WE].length + 1;
          ttsByTimePeriod[WE].push(v);
          row[npmrdsDataKey] = v;
        }
      } else {
        ttsByTimePeriod[OVN] = ttsByTimePeriod[OVN] || [];
        const v = ttsByTimePeriod[OVN].length + 1;
        ttsByTimePeriod[OVN].push(v);
        row[npmrdsDataKey] = v;
      }
    });

    const expectedPctls = {
      fiftiethPctlsByTimePeriod: Object.keys(ttsByTimePeriod).reduce(
        (acc, timePeriod) => {
          const len = ttsByTimePeriod[timePeriod].length;
          const n = (len - 1) * 0.5;
          const v = Number.isSafeInteger(n)
            ? ttsByTimePeriod[timePeriod][n]
            : (ttsByTimePeriod[timePeriod][Math.floor(n)] +
                ttsByTimePeriod[timePeriod][Math.ceil(n)]) /
              2;

          acc[timePeriod] = precisionRound(v);
          return acc;
        },
        {}
      ),
      ninetyfifthPctlsByTimePeriod: Object.keys(ttsByTimePeriod).reduce(
        (acc, timePeriod) => {
          const len = ttsByTimePeriod[timePeriod].length;
          const n = (len - 1) * 0.95;
          const v = Number.isSafeInteger(n)
            ? ttsByTimePeriod[timePeriod][n]
            : (ttsByTimePeriod[timePeriod][Math.floor(n)] +
                ttsByTimePeriod[timePeriod][Math.ceil(n)]) /
              2;

          acc[timePeriod] = precisionRound(v);
          return acc;
        },
        {}
      )
    };

    const result = await tttrCalculator.calculateForTmc({ data, attrs });

    [AMP, MIDD, PMP, WE, OVN].forEach(timePeriod => {
      expect(result.fiftiethPctlTravelTimeByTimePeriod[timePeriod]).toBeCloseTo(
        expectedPctls.fiftiethPctlsByTimePeriod[timePeriod],
        CLOSENESS_PRECISION
      );

      expect(
        result.ninetyfifthPctlTravelTimeByTimePeriod[timePeriod]
      ).toBeCloseTo(
        expectedPctls.ninetyfifthPctlsByTimePeriod[timePeriod],
        CLOSENESS_PRECISION
      );

      expect(result.tttrByTimePeriod[timePeriod]).toBeCloseTo(
        precisionRound(
          expectedPctls.ninetyfifthPctlsByTimePeriod[timePeriod] /
            expectedPctls.fiftiethPctlsByTimePeriod[timePeriod],
          2
        ),
        CLOSENESS_PRECISION
      );
    });

    done();
  });
});

describe.each(timeBinSizes)('Time Bin Size %d', timeBinSize => {
  test(`TTTR excess delay hours`, async done => {
    const randomTmcSql = `
      SELECT
          tmc
        FROM ny.tmc_metadata_${YEAR}
        OFFSET random() * (SELECT COUNT(1) FROM ny.tmc_metadata_${YEAR})
        LIMIT 1 ; `;

    const {
      rows: [{ tmc }]
    } = await query(randomTmcSql);

    const sql = `
      SELECT
          ROUND(
            (percentile_disc(0.5) WITHIN GROUP (ORDER BY avg_tt))::NUMERIC
          ) AS fiftieth_pctl,
          ROUND(
            (percentile_disc(0.95) WITHIN GROUP (ORDER BY avg_tt))::NUMERIC
          ) AS ninetyfifth_pctl,
          ROUND(
            (
              (percentile_disc(0.95) WITHIN GROUP (ORDER BY avg_tt))::NUMERIC
              /
              (percentile_disc(0.5) WITHIN GROUP (ORDER BY avg_tt))::NUMERIC
            ),
            2
          )::NUMERIC AS tttr,
          COUNT(1) AS tt_ct,
          CASE
            WHEN (start_epoch BETWEEN (6*12) AND (20*12 -1)) THEN
              CASE WHEN (dow BETWEEN 1 AND 5)
                THEN
                  CASE
                    WHEN (start_epoch BETWEEN (6*12) AND (10*12 - 1)) THEN '${AMP}'
                    WHEN (start_epoch BETWEEN (10*12) AND (16*12 - 1)) THEN '${MIDD}'
                    ELSE '${PMP}'
                END
                ELSE 'WE'
              END
            ELSE 'OVN'
          END AS time_period
        FROM (
          SELECT
              tmc,
              COALESCE(
                AVG(travel_time_freight_trucks::NUMERIC),
                AVG(travel_time_all_vehicles::NUMERIC)
              )::NUMERIC AS avg_tt,
              MIN(EXTRACT(DOW FROM date)) AS dow,
              MIN(epoch) AS start_epoch
            FROM ny.npmrds
            WHERE (
              (tmc = '${tmc}')
              AND
              (date >= '${YEAR}0101')
              AND
              (date < '${YEAR + 1}0101')
            )
            GROUP BY tmc, date, FLOOR(epoch / (${timeBinSize} / 5))
        ) AS t1
        GROUP BY time_period
      ;
    `;

    const { rows } = await query(sql);

    const dbResultsByTimePeriod = rows.reduce(
      (acc, { fiftieth_pctl, ninetyfifth_pctl, tttr, time_period }) => {
        acc[time_period] = {
          fiftieth_pctl: +fiftieth_pctl,
          ninetyfifth_pctl: +ninetyfifth_pctl,
          tttr: +tttr
        };
        return acc;
      },
      {}
    );

    const tttrCalculator = new TttrCalculator({
      year: YEAR,
      timeBinSize,
      outputFormat: IDENTITY
    });

    const { requiredTmcMetadata } = tttrCalculator;

    const [attrs] = await getMetadataForTmcs({
      year: YEAR,
      tmcs: tmc,
      columns: requiredTmcMetadata
    });

    const { npmrdsDataKeys } = tttrCalculator;

    const data = await getBinnedYearNpmrdsDataForTmc({
      year: YEAR,
      timeBinSize,
      tmc,
      state: attrs.state,
      npmrdsDataKeys
    });

    NpmrdsDataEnricher.enrichData({ year: YEAR, timeBinSize, data });

    const result = await tttrCalculator.calculateForTmc({ data, attrs });

    [AMP, MIDD, PMP, WE, OVN].forEach(timePeriod => {
      expect(
        get(dbResultsByTimePeriod, [timePeriod, 'fiftieth_pctl'], null),
        `${tmc} 50pctl ${timePeriod} TT (timeBinSize=${timeBinSize})`
      ).toBeCloseTo(
        get(result, ['fiftiethPctlTravelTimeByTimePeriod', timePeriod], null),
        CLOSENESS_PRECISION
      );
      expect(
        get(dbResultsByTimePeriod, [timePeriod, 'ninetyfifth_pctl'], null),
        `${tmc} 95pctl TT ${timePeriod} (timeBinSize=${timeBinSize})`
      ).toBeCloseTo(
        get(
          result,
          ['ninetyfifthPctlTravelTimeByTimePeriod', timePeriod],
          null
        ),
        CLOSENESS_PRECISION
      );
      expect(
        dbResultsByTimePeriod[timePeriod].tttr,
        `${tmc} TTTR ${timePeriod} (timeBinSize=${timeBinSize})`
      ).toBeCloseTo(
        get(result, ['tttrByTimePeriod', timePeriod], null),
        CLOSENESS_PRECISION
      );
    });

    done();
  });
});

afterAll(async done => {
  await end();
  done();
});
