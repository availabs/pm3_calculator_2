const assert = require('assert');

const { isEqual, pick } = require('lodash');
const { quantileSorted } = require('simple-statistics');

const { ARITHMETIC, HARMONIC } = require('../../enums/meanTypes');
const { TRAVEL_TIME, SPEED } = require('../../enums/npmrdsMetrics');
const { AMP, MIDD, PMP, WE } = require('../../enums/pm3TimePeriods');

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
  PM3_TIME_PERIOD_SPEC
} = timePeriodSpecNamesEnum;

const defaultTimePeriodSpec = pick(
  generalTimePeriodSpecs[PM3_TIME_PERIOD_SPEC],
  [AMP, MIDD, PMP, WE]
);

const outputFormatters = require('./LottrOutputFormatters');

const LOTTR = 'LOTTR';
const TWENTIETH_PCTL = 0.2;
const FIFTIETH_PCTL = 0.5;
const EIGHTIETH_PCTL = 0.8;

function isCanonicalConfig(configDefaults) {
  return (
    this.timeBinSize === 15 &&
    Object.keys(configDefaults).every(k => isEqual(this[k], configDefaults[k]))
  );
}

class LottrCalculator {
  constructor(calcConfigParams) {
    const { configDefaults } = LottrCalculator;

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
      npmrdsDataKeys: [npmrdsDataKey]
    } = this;

    const metricValuesByTimePeriod = data.reduce((acc, row) => {
      assert.strictEqual(row.tmc, attrs.tmc);

      const { [npmrdsDataKey]: metricValue } = row;

      const timePeriod = this.timePeriodIdentifier(row);

      if (timePeriod && metricValue !== null) {
        acc[timePeriod] = acc[timePeriod] || [];
        acc[timePeriod].push(metricValue);
      }

      return acc;
    }, {});

    Object.values(metricValuesByTimePeriod).forEach(metricValues =>
      metricValues.sort(numbersComparator)
    );

    const fiftiethPctlTravelTimeByTimePeriod = this.isSpeedBased
      ? null
      : Object.keys(metricValuesByTimePeriod).reduce((acc, timePeriod) => {
          const v = quantileSorted(
            metricValuesByTimePeriod[timePeriod],
            FIFTIETH_PCTL
          );

          acc[timePeriod] = this.roundTravelTimes ? precisionRound(v) : v;
          return acc;
        }, {});

    const fiftiethPctlSpeedByTimePeriod = this.isSpeedBased
      ? Object.keys(metricValuesByTimePeriod).reduce((acc, timePeriod) => {
          const v = quantileSorted(
            metricValuesByTimePeriod[timePeriod],
            FIFTIETH_PCTL
          );

          acc[timePeriod] = this.roundTravelTimes ? precisionRound(v) : v;
          return acc;
        }, {})
      : null;

    const eightiethPctlTravelTimeByTimePeriod = this.isSpeedBased
      ? null
      : Object.keys(metricValuesByTimePeriod).reduce((acc, timePeriod) => {
          const v = quantileSorted(
            metricValuesByTimePeriod[timePeriod],
            EIGHTIETH_PCTL
          );

          acc[timePeriod] = this.roundTravelTimes ? precisionRound(v) : v;
          return acc;
        }, {});

    const twentiethPctlSpeedByTimePeriod = this.isSpeedBased
      ? Object.keys(metricValuesByTimePeriod).reduce((acc, timePeriod) => {
          const v = quantileSorted(
            metricValuesByTimePeriod[timePeriod],
            TWENTIETH_PCTL
          );

          acc[timePeriod] = this.roundTravelTimes ? precisionRound(v) : v;
          return acc;
        }, {})
      : null;

    const lottrByTimePeriod = Object.keys(metricValuesByTimePeriod).reduce(
      (acc, timePeriod) => {
        const lottr = this.isSpeedBased
          ? fiftiethPctlSpeedByTimePeriod[timePeriod] /
            twentiethPctlSpeedByTimePeriod[timePeriod]
          : eightiethPctlTravelTimeByTimePeriod[timePeriod] /
            fiftiethPctlTravelTimeByTimePeriod[timePeriod];

        acc[timePeriod] = this.roundTravelTimes
          ? precisionRound(lottr, 2)
          : lottr;

        return acc;
      },
      {}
    );

    const result = Object.assign(
      {
        tmc,
        npmrdsDataKey,
        lottrByTimePeriod
      },
      this.isSpeedBased
        ? { fiftiethPctlSpeedByTimePeriod, twentiethPctlSpeedByTimePeriod }
        : {
            fiftiethPctlTravelTimeByTimePeriod,
            eightiethPctlTravelTimeByTimePeriod
          }
    );

    return this.outputFormatter(result);
  }
}

LottrCalculator.measure = LOTTR;
LottrCalculator.configDefaults = {
  meanType: ARITHMETIC,
  npmrdsDataSource: ALL,
  npmrdsMetric: TRAVEL_TIME,
  timePeriodSpec: MEASURE_DEFAULT_TIME_PERIOD_SPEC,
  roundTravelTimes: true
};
LottrCalculator.configOptions = {
  meanType: [ARITHMETIC, HARMONIC],
  npmrdsDataSource: npmrdsDataSources,
  npmrdsMetric: [TRAVEL_TIME, SPEED],
  timePeriodSpec: timePeriodSpecNames,
  roundTravelTimes: [true, false]
};
LottrCalculator.defaultTimePeriodSpec = defaultTimePeriodSpec;

module.exports = LottrCalculator;
