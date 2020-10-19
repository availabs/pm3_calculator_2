const assert = require('assert');

const { isEqual } = require('lodash');
const { quantileSorted } = require('simple-statistics');
const _ = require('lodash');

const { ARITHMETIC, HARMONIC } = require('../../enums/meanTypes');
const { SPEED } = require('../../enums/npmrdsMetrics');

const { numbersComparator } = require('../../utils/MathUtils');

const createTimePeriodIdentifier = require('../timePeriods/createTimePeriodIdentifier');

const { getNpmrdsDataKey } = require('../../utils/NpmrdsDataKey');

const npmrdsDataSourcesEnum = require('../../enums/npmrdsDataSources');

const npmrdsDataSources = Object.keys(npmrdsDataSourcesEnum);
const { ALL } = npmrdsDataSourcesEnum;

const {
  names: timePeriodSpecNamesEnum,
  specs: generalTimePeriodSpecs,
} = require('../timePeriods/TimePeriodSpecs');

const timePeriodSpecNames = Object.keys(timePeriodSpecNamesEnum);

const {
  MEASURE_DEFAULT_TIME_PERIOD_SPEC,
  PM3_TIME_PERIOD_SPEC,
} = timePeriodSpecNamesEnum;

const defaultTimePeriodSpec = generalTimePeriodSpecs[PM3_TIME_PERIOD_SPEC];

const outputFormatters = require('./SpeedPercentilesOutputFormatters');

const SPEED_PERCENTILES = 'SPEED_PERCENTILES';
const percentiles = [5, 20, 25, 50, 75, 80, 85, 95];

function isCanonicalConfig(configDefaults) {
  return (
    this.timeBinSize === 15 &&
    Object.keys(configDefaults).every((k) =>
      isEqual(this[k], configDefaults[k]),
    )
  );
}

class SpeedPercentilesCalculator {
  constructor(calcConfigParams) {
    const { configDefaults } = SpeedPercentilesCalculator;

    this.year = calcConfigParams.year;
    this.meanType = calcConfigParams.meanType;
    this.timeBinSize = calcConfigParams.timeBinSize;

    this.outputFormatter = outputFormatters[calcConfigParams.outputFormat].bind(
      this,
    );

    Object.keys(configDefaults).forEach((k) => {
      this[k] =
        calcConfigParams[k] === undefined
          ? configDefaults[k]
          : calcConfigParams[k];
    });

    const timePeriodSpecDef =
      this.timePeriodSpec === MEASURE_DEFAULT_TIME_PERIOD_SPEC
        ? defaultTimePeriodSpec
        : generalTimePeriodSpecs[this.timePeriodSpec];

    this.timePeriodIdentifier = createTimePeriodIdentifier(timePeriodSpecDef);

    this.npmrdsDataKeys = [getNpmrdsDataKey(this)];

    this.isCanonical = isCanonicalConfig.call(this, configDefaults);
  }

  async calculateForTmc({ data, attrs }) {
    const { tmc } = attrs;
    const {
      npmrdsDataKeys: [npmrdsDataKey],
    } = this;

    const allSpeeds = [];
    const speedsByTimePeriod = data.reduce((acc, row) => {
      assert.strictEqual(row.tmc, attrs.tmc);

      const { [npmrdsDataKey]: speed } = row;

      const timePeriod = this.timePeriodIdentifier(row);

      if (speed !== null) {
        allSpeeds.push(speed);
      }

      if (timePeriod && speed !== null) {
        acc[timePeriod] = acc[timePeriod] || [];
        acc[timePeriod].push(speed);
      }

      return acc;
    }, {});

    speedsByTimePeriod.total = allSpeeds;

    Object.values(speedsByTimePeriod).forEach((metricValues) =>
      metricValues.sort(numbersComparator),
    );

    const speedPercentilesByTimePeriod = percentiles.reduce((acc1, pctl) => {
      acc1[pctl] = Object.keys(speedsByTimePeriod).reduce(
        (acc2, timePeriod) => {
          acc2[timePeriod] = _.round(
            quantileSorted(
              speedsByTimePeriod[timePeriod],
              _.round(pctl / 100, 2),
            ),
          );

          return acc2;
        },
        {},
      );

      return acc1;
    }, {});

    const result = {
      tmc,
      npmrdsDataKey,
      speedPercentilesByTimePeriod,
    };

    return this.outputFormatter(result);
  }
}

SpeedPercentilesCalculator.measure = SPEED_PERCENTILES;

SpeedPercentilesCalculator.configDefaults = {
  meanType: ARITHMETIC,
  npmrdsDataSource: ALL,
  npmrdsMetric: SPEED,
  timePeriodSpec: MEASURE_DEFAULT_TIME_PERIOD_SPEC,
  roundTravelTimes: true,
};
SpeedPercentilesCalculator.configOptions = {
  meanType: [ARITHMETIC, HARMONIC],
  npmrdsDataSource: npmrdsDataSources,
  npmrdsMetric: [SPEED],
  timePeriodSpec: timePeriodSpecNames,
  roundTravelTimes: [true],
};
SpeedPercentilesCalculator.defaultTimePeriodSpec = defaultTimePeriodSpec;

module.exports = SpeedPercentilesCalculator;
