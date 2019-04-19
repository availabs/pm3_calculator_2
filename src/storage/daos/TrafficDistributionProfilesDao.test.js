const { chain, size, sum, uniq } = require('lodash');
const { cartesianProduct } = require('../../utils/SetUtils');

const TrafficDistributionDowAdjustmentFactors = require('../static/TrafficDistributionDowAdjustmentFactors');

const {
  getFractionOfDailyAadtByDowByTimeBin
} = require('./TrafficDistributionProfilesDao');

const functionalClasses = Object.keys(require('../../enums/functionalClasses'));
const congestionLevels = Object.keys(require('../../enums/congestionLevels'));
const directionalities = Object.keys(require('../../enums/directionalities'));
const trafficDistributionProfilesVersions = Object.keys(
  require('../../enums/trafficDistributionProfilesVersions')
);

const trafficDistributionTimeBinSizes = [5, 15, 60];
const timeBinSizes = [5, 15, 60];

const CLOSENESS_PRECISION = 10;
const DAYS_IN_WEEK = 7;
const MINUTES_IN_DAY = 24 * 60;

const paramCombos = cartesianProduct(
  functionalClasses,
  congestionLevels,
  directionalities,
  trafficDistributionProfilesVersions,
  trafficDistributionTimeBinSizes,
  timeBinSizes
);

describe.each(paramCombos)(
  'funClass: %s | congLev: %s | dirlty: %s | tdpVer: %s | tdpSz: %d | tbSz: %d',
  (
    functionalClass,
    congestionLevel,
    directionality,
    trafficDistributionProfilesVersion,
    trafficDistributionTimeBinSize,
    timeBinSize
  ) => {
    test(`fractions sum to dow adj factors`, async done => {
      const timeBinsInDay = MINUTES_IN_DAY / timeBinSize;

      const fractionOfDailyAadtByDowByTimeBin = await getFractionOfDailyAadtByDowByTimeBin(
        {
          functionalClass,
          congestionLevel,
          directionality,
          trafficDistributionProfilesVersion,
          trafficDistributionTimeBinSize,
          timeBinSize
        }
      );

      // One fractionOfDailyAadtByTimeBin for each day of the week.
      expect(fractionOfDailyAadtByDowByTimeBin.length).toEqual(DAYS_IN_WEEK);

      // One fractionOfDailyAadt for each time bin
      fractionOfDailyAadtByDowByTimeBin.forEach(fractionOfDailyAadtByTimeBin =>
        expect(fractionOfDailyAadtByTimeBin.length).toEqual(timeBinsInDay)
      );

      // When the trafficDistributionTimeBinSize is greater than the timeBinSize timeBins
      // within the same trafficDistributionTimeBin should have the same fraction of AADT.
      if (trafficDistributionTimeBinSize > timeBinSize) {
        const chunkSize = Math.floor(
          trafficDistributionTimeBinSize / timeBinSize
        );

        fractionOfDailyAadtByDowByTimeBin.forEach(
          fractionOfDailyAadtByTimeBin => {
            const uniqChunkFractionsCount = chain(fractionOfDailyAadtByTimeBin)
              .chunk(chunkSize)
              .map(uniq) // unique values per chunk
              .map(size) // the count of unique values per chunk
              .uniq() // Unique counts of unique values per chunk
              .value();

            // Within chunks, all timeBins have the same fraction of AADT
            expect(uniqChunkFractionsCount.length).toBe(1);
          }
        );
      }

      // For each day of the week, the fractionOfDailyAadt per time bin should
      // sum to the day of week's share of weekly traffic (DOW Adjustment Factor).
      fractionOfDailyAadtByDowByTimeBin.forEach(
        (fractionOfDailyAadtByTimeBin, dow) =>
          expect(sum(fractionOfDailyAadtByTimeBin)).toBeCloseTo(
            TrafficDistributionDowAdjustmentFactors[dow],
            CLOSENESS_PRECISION
          )
      );

      done();
    });
  }
);
