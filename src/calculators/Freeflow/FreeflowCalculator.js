const assert = require('assert');

const { isEqual } = require('lodash');
const { quantileSorted } = require('simple-statistics');

const { ARITHMETIC, HARMONIC } = require('../../enums/meanTypes');
const { TRAVEL_TIME, SPEED } = require('../../enums/npmrdsMetrics');

const { numbersComparator, precisionRound } = require('../../utils/MathUtils');

const createTimePeriodIdentifier = require('../timePeriods/createTimePeriodIdentifier');

const { getNpmrdsDataKey } = require('../../utils/NpmrdsDataKey');

const npmrdsDataSourcesEnum = require('../../enums/npmrdsDataSources');

const npmrdsDataSources = Object.keys(npmrdsDataSourcesEnum);
const { ALL } = npmrdsDataSourcesEnum;

const {
  names: timePeriodSpecNamesEnum,
  specs: generalTimePeriodSpecs
} = require('../timePeriods/TimePeriodSpecs');

const timePeriodSpecNames = Object.keys(timePeriodSpecNamesEnum);

const {
  MEASURE_DEFAULT_TIME_PERIOD_SPEC,
  FREEFLOW_TIME_PERIOD_SPEC
} = timePeriodSpecNamesEnum;

const defaultTimePeriodSpec =
  generalTimePeriodSpecs[FREEFLOW_TIME_PERIOD_SPEC];

const outputFormatters = require('./FreeflowOutputFormatters');

const FREEFLOW = 'FREEFLOW';
const FIFTEENTH_PCTL = 0.15;
const EIGHTY_FIFTH_PCTL = 0.85;

function isCanonicalConfig(configDefaults) {
  return (
    this.timeBinSize === 15 &&
    Object.keys(configDefaults).every(k => isEqual(this[k], configDefaults[k]))
  );
}

class FreeflowCalculator {
  constructor(calcConfigParams) {
    const { configDefaults } = FreeflowCalculator;

    this.year = calcConfigParams.year;
    this.meanType = calcConfigParams.meanType;
    this.timeBinSize = calcConfigParams.timeBinSize;

    this.outputFormatter = outputFormatters[calcConfigParams.outputFormat].bind(
      this
    );

    Object.keys(configDefaults).forEach(k => {
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

    this.isSpeedBased = this.npmrdsMetric === SPEED;

    this.isCanonical = isCanonicalConfig.call(this, configDefaults);
  }

  async calculateForTmc({ data, attrs }) {
    const { tmc } = attrs;
    const {
      isSpeedBased,
      roundTravelTimes,
      npmrdsDataKeys: [npmrdsDataKey]
    } = this;

    const metricValuesAcrossTimePeriods = data
      .reduce((acc, row) => {
        assert.strictEqual(row.tmc, attrs.tmc);

        const { [npmrdsDataKey]: metricValue } = row;

        const timePeriod = this.timePeriodIdentifier(row);

        if (timePeriod && metricValue !== null) {
          acc.push(metricValue);
        }

        return acc;
      }, [])
      .sort(numbersComparator);

    const result = { tmc, npmrdsDataKey };

    if (
      Array.isArray(metricValuesAcrossTimePeriods) &&
      metricValuesAcrossTimePeriods.length
    ) {
      if (isSpeedBased) {
        result.eightyFifthPctlSpeed = roundTravelTimes
          ? precisionRound(
              quantileSorted(metricValuesAcrossTimePeriods, EIGHTY_FIFTH_PCTL)
            )
          : quantileSorted(metricValuesAcrossTimePeriods, EIGHTY_FIFTH_PCTL);
      } else {
        result.fifteenthPctlTravelTime = precisionRound
          ? precisionRound(
              quantileSorted(metricValuesAcrossTimePeriods, FIFTEENTH_PCTL)
            )
          : quantileSorted(metricValuesAcrossTimePeriods, FIFTEENTH_PCTL);
      }
    } else if (isSpeedBased) {
      result.eightyFifthPctlSpeed = null;
    } else {
      result.fifteenthPctlTravelTime = null;
    }

    return this.outputFormatter(result);
  }
}

FreeflowCalculator.measure = FREEFLOW;
FreeflowCalculator.configDefaults = {
  meanType: ARITHMETIC,
  npmrdsDataSource: ALL,
  npmrdsMetric: TRAVEL_TIME,
  timePeriodSpec: MEASURE_DEFAULT_TIME_PERIOD_SPEC,
  roundTravelTimes: false
};
FreeflowCalculator.configOptions = {
  meanType: [ARITHMETIC, HARMONIC],
  npmrdsDataSource: npmrdsDataSources,
  npmrdsMetric: [TRAVEL_TIME, SPEED],
  timePeriodSpec: timePeriodSpecNames,
  roundTravelTimes: [true, false]
};
FreeflowCalculator.defaultTimePeriodSpec = defaultTimePeriodSpec;

module.exports = FreeflowCalculator;
