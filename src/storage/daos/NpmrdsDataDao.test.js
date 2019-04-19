const { last } = require('lodash');
const { mean, harmonicMean } = require('simple-statistics');

const { end } = require('../services/DBService');
const { cartesianProduct } = require('../../utils/SetUtils');
const { getNpmrdsDataKey } = require('../../utils/NpmrdsDataKey');
const { getBinnedYearNpmrdsDataForTmc } = require('./NpmrdsDataDao');

const { ALL, PASS, TRUCK } = require('../../enums/npmrdsDataSources');
const { TRAVEL_TIME, SPEED } = require('../../enums/npmrdsMetrics');
const { ARITHMETIC, HARMONIC } = require('../../enums/meanTypes');

jest.setTimeout(120000);

const YEAR = 2017;
const TMC = '104+04105';
const STATE = 'ny';
const TMC_MILES = 0.32720154118;

const MINUTES_PER_EPOCH = 5;
const CLOSENESS_PRECISION = 8;

const timeBinSizes = [5, 15, 60];

const avgTTAllDataKey = getNpmrdsDataKey({
  meanType: ARITHMETIC,
  npmrdsMetric: TRAVEL_TIME,
  npmrdsDataSource: ALL
});

const avgTTPassDataKey = getNpmrdsDataKey({
  meanType: ARITHMETIC,
  npmrdsMetric: TRAVEL_TIME,
  npmrdsDataSource: PASS
});

const avgTTTruckDataKey = getNpmrdsDataKey({
  meanType: ARITHMETIC,
  npmrdsMetric: TRAVEL_TIME,
  npmrdsDataSource: TRUCK
});

const avgSpeedAllDataKey = getNpmrdsDataKey({
  meanType: ARITHMETIC,
  npmrdsMetric: SPEED,
  npmrdsDataSource: ALL
});

const avgSpeedPassDataKey = getNpmrdsDataKey({
  meanType: ARITHMETIC,
  npmrdsMetric: SPEED,
  npmrdsDataSource: PASS
});

const avgSpeedTruckDataKey = getNpmrdsDataKey({
  meanType: ARITHMETIC,
  npmrdsMetric: SPEED,
  npmrdsDataSource: TRUCK
});

const hmeanTTAllDataKey = getNpmrdsDataKey({
  meanType: HARMONIC,
  npmrdsMetric: TRAVEL_TIME,
  npmrdsDataSource: ALL
});

const hmeanTTPassDataKey = getNpmrdsDataKey({
  meanType: HARMONIC,
  npmrdsMetric: TRAVEL_TIME,
  npmrdsDataSource: PASS
});

const hmeanTTTruckDataKey = getNpmrdsDataKey({
  meanType: HARMONIC,
  npmrdsMetric: TRAVEL_TIME,
  npmrdsDataSource: TRUCK
});

const hmeanSpeedAllDataKey = getNpmrdsDataKey({
  meanType: HARMONIC,
  npmrdsMetric: SPEED,
  npmrdsDataSource: ALL
});

const hmeanSpeedPassDataKey = getNpmrdsDataKey({
  meanType: HARMONIC,
  npmrdsMetric: SPEED,
  npmrdsDataSource: PASS
});

const hmeanSpeedTruckDataKey = getNpmrdsDataKey({
  meanType: HARMONIC,
  npmrdsMetric: SPEED,
  npmrdsDataSource: TRUCK
});

const npmrdsDataKeys = [
  avgTTAllDataKey,
  avgTTPassDataKey,
  avgTTTruckDataKey,
  avgSpeedAllDataKey,
  avgSpeedPassDataKey,
  avgSpeedTruckDataKey,
  hmeanTTAllDataKey,
  hmeanTTPassDataKey,
  hmeanTTTruckDataKey,
  hmeanSpeedAllDataKey,
  hmeanSpeedPassDataKey,
  hmeanSpeedTruckDataKey
];

const newNpmrdsDataTimeBinner = timeBinSize => (acc, curRow) => {
  const epochsPerBin = timeBinSize / MINUTES_PER_EPOCH;
  const prevRow = last(acc);

  const { date: prevDate, timeBinNum: prevTimeBinNum } = prevRow || {};
  const { date: curDate, timeBinNum: curTimeBinNum } = curRow;

  if (
    prevDate === curDate &&
    prevTimeBinNum === Math.floor(curTimeBinNum / epochsPerBin)
  ) {
    if (curRow[avgTTAllDataKey] !== null) {
      prevRow[avgTTAllDataKey].push(curRow[avgTTAllDataKey]);
    }
    if (curRow[avgTTPassDataKey] !== null) {
      prevRow[avgTTPassDataKey].push(curRow[avgTTPassDataKey]);
    }
    if (curRow[avgTTTruckDataKey] !== null) {
      prevRow[avgTTTruckDataKey].push(curRow[avgTTTruckDataKey]);
    }
  } else {
    acc.push({
      date: curRow.date,
      timeBinNum: Math.floor(curRow.timeBinNum / epochsPerBin),
      [avgTTAllDataKey]:
        curRow[avgTTAllDataKey] !== null ? [curRow[avgTTAllDataKey]] : [],
      [avgTTPassDataKey]:
        curRow[avgTTPassDataKey] !== null ? [curRow[avgTTPassDataKey]] : [],
      [avgTTTruckDataKey]:
        curRow[avgTTTruckDataKey] !== null ? [curRow[avgTTTruckDataKey]] : []
    });
  }

  return acc;
};

const getMean = arr => (arr.length ? mean(arr) : null);
const getHarmonicMean = arr =>
  arr.filter(n => n).length ? harmonicMean(arr.filter(n => n)) : null;

const binnedNpmrdsDataRowAggregator = row =>
  Object.assign({}, row, {
    // "bin" "avg" travel times into 5-min chunks
    [avgTTAllDataKey]: getMean(row[avgTTAllDataKey]),
    [avgTTPassDataKey]: getMean(row[avgTTPassDataKey]),
    [avgTTTruckDataKey]: getMean(row[avgTTTruckDataKey]),

    // "bin" "avg" computed speeds into 5-min chunks
    [avgSpeedAllDataKey]: getMean(
      row[avgTTAllDataKey].map(tt => (TMC_MILES / tt) * 3600)
    ),
    [avgSpeedPassDataKey]: getMean(
      row[avgTTPassDataKey].map(tt => (TMC_MILES / tt) * 3600)
    ),
    [avgSpeedTruckDataKey]: getMean(
      row[avgTTTruckDataKey].map(tt => (TMC_MILES / tt) * 3600)
    ),

    // "bin" "hmean" travel times into 5-min chunks
    [hmeanTTAllDataKey]: getHarmonicMean(row[avgTTAllDataKey]),
    [hmeanTTPassDataKey]: getHarmonicMean(row[avgTTPassDataKey]),
    [hmeanTTTruckDataKey]: getHarmonicMean(row[avgTTTruckDataKey]),

    // "bin" "hmean" computed speeds into 5-min chunks
    [hmeanSpeedAllDataKey]: getHarmonicMean(
      row[avgTTAllDataKey].filter(n => n).map(tt => (TMC_MILES / tt) * 3600)
    ),
    [hmeanSpeedPassDataKey]: getHarmonicMean(
      row[avgTTPassDataKey].filter(n => n).map(tt => (TMC_MILES / tt) * 3600)
    ),
    [hmeanSpeedTruckDataKey]: getHarmonicMean(
      row[avgTTTruckDataKey].filter(n => n).map(tt => (TMC_MILES / tt) * 3600)
    )
  });

let jsAggregatedNpmrdsDataByTimeBinSize;

const npmrdsDataSortComparator = (a, b) =>
  a.date.localeCompare(b.date) || +a.timeBinNum - +b.timeBinNum;

beforeAll(async done => {
  const d = await getBinnedYearNpmrdsDataForTmc({
    year: YEAR,
    timeBinSize: 5,
    tmc: TMC,
    state: STATE,
    npmrdsDataKeys: [avgTTAllDataKey, avgTTPassDataKey, avgTTTruckDataKey]
  });

  d.sort(npmrdsDataSortComparator);

  jsAggregatedNpmrdsDataByTimeBinSize = timeBinSizes.reduce(
    (acc, timeBinSize) => {
      acc[timeBinSize] = d
        .reduce(newNpmrdsDataTimeBinner(timeBinSize), [])
        .map(binnedNpmrdsDataRowAggregator);

      return acc;
    },
    {}
  );

  done();
});

describe.each(timeBinSizes)(
  '%ds TimeBinSize Tests: All fields in single request',
  timeBinSize => {
    test(`${timeBinSize} minute bins`, async done => {
      const dbAggregatedData = await getBinnedYearNpmrdsDataForTmc({
        year: YEAR,
        timeBinSize,
        tmc: TMC,
        state: STATE,
        npmrdsDataKeys
      });

      dbAggregatedData.sort(npmrdsDataSortComparator);

      jsAggregatedNpmrdsDataByTimeBinSize[timeBinSize].forEach((rowA, i) => {
        const rowB = dbAggregatedData[i];
        npmrdsDataKeys.forEach(k => {
          const a = rowA[k];
          const b = rowB[k];

          if (a === null) {
            expect(b).toBeNull();
          } else {
            expect(a).toBeCloseTo(b, CLOSENESS_PRECISION);
          }
        });
      });

      done();
    });
  }
);

describe.each(cartesianProduct(timeBinSizes, npmrdsDataKeys))(
  '%ds TimeBinSize Tests: %s request only',
  (timeBinSize, npmrdsDataKey) => {
    test(npmrdsDataKey, async done => {
      const dbAggregatedData = await getBinnedYearNpmrdsDataForTmc({
        year: YEAR,
        timeBinSize,
        tmc: TMC,
        state: STATE,
        npmrdsDataKeys: [npmrdsDataKey]
      });

      dbAggregatedData.sort(npmrdsDataSortComparator);

      const jsAggregatedNpmrdsData =
        jsAggregatedNpmrdsDataByTimeBinSize[timeBinSize];

      expect(jsAggregatedNpmrdsData.length).toEqual(dbAggregatedData.length);
      expect(
        jsAggregatedNpmrdsData.map(({ date, timeBinNum }) => ({
          date,
          timeBinNum
        }))
      ).toEqual(
        jsAggregatedNpmrdsData.map(({ date, timeBinNum }) => ({
          date,
          timeBinNum
        }))
      );

      jsAggregatedNpmrdsData.forEach((rowA, i) => {
        const rowB = dbAggregatedData[i];
        const a = rowA[npmrdsDataKey];
        const b = rowB[npmrdsDataKey];

        if (a === null) {
          expect(b).toBeNull();
        } else {
          expect(b).toBeCloseTo(a, CLOSENESS_PRECISION);
        }
      });

      done();
    });
  }
);

afterAll(async done => {
  await end();
  done();
});
