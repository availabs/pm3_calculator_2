/*
	From FinalRule:
		The TTTR metric shall be reported to HPMS for each reporting segment (to
		the nearest hundredths) for each of the five time periods identified in
		paragraphs (a)(1)(i) through (v) of this section; the corresponding 95th
		percentile travel times (to the nearest second) and the corresponding normal
		(50th percentile) travel times (to the nearest second).

	From Travel Time Metric Data Reporting Requirements & Specifications
		Truck travel time reliability (TTTR) metric for a reporting segment for “AM Peak.” “AM Peak” is between
		the hours of 6:00 a.m. and 10:00 a.m. for every weekday (Monday through Friday) from January 1st
		through December 31st of the same calendar year, as described in 23 CFR 490.611(a)(1)(i). As described
		in 23 CFR 490.611(a)(3), the reported value for AM Peak Truck Travel Time Reliability (TTTR_AMP) for a
		reporting segment the AM Peak 95th Percentile Truck Travel Time (TTT_AMP95PCT) for that reporting
		segment divided by the AM Peak 50th Percentile Truck Travel Time (TTT_AMP50PCT) for that reporting
		segment and rounded to the nearest hundredth. For computing TTTR_AMP metric, the travel time
		values TTT_AMP50PCT and TTT_AMP95PCT should not be rounded. However, reported
		TTT_AMP50PCT and TTT_AMP95PCT values must be in units of seconds rounded to the nearest integer,
		as required in 23 CFR 490.611(b)(2).
*/
const assert = require('assert');

const { isEqual } = require('lodash');

const { quantileSorted } = require('simple-statistics');

const npmrdsDataSourcesEnum = require('../../enums/npmrdsDataSources');

const npmrdsDataSources = Object.keys(npmrdsDataSourcesEnum);
const { TRUCK } = npmrdsDataSourcesEnum;

const { ARITHMETIC, HARMONIC } = require('../../enums/meanTypes');
const { TRAVEL_TIME, SPEED } = require('../../enums/npmrdsMetrics');

const { numbersComparator, precisionRound } = require('../../utils/MathUtils');

const createTimePeriodIdentifier = require('../timePeriods/createTimePeriodIdentifier');

const { getNpmrdsDataKey } = require('../../utils/NpmrdsDataKey');

const {
  names: timePeriodSpecNamesEnum,
  specs: generalTimePeriodSpecs
} = require('../timePeriods/TimePeriodSpecs');

const timePeriodSpecNames = Object.keys(timePeriodSpecNamesEnum);

const {
  MEASURE_DEFAULT_TIME_PERIOD_SPEC,
  PM3_TIME_PERIOD_SPEC
} = timePeriodSpecNamesEnum;

const defaultTimePeriodSpec = generalTimePeriodSpecs[PM3_TIME_PERIOD_SPEC];

const outputFormatters = require('./TttrOutputFormatters');

const TTTR = 'TTTR';
const FIFTH_PCTL = 0.05;
const FIFTIETH_PCTL = 0.5;
const NINETYFIFTH_PCTL = 0.95;

function isCanonicalConfig(configDefaults) {
  return (
    this.timeBinSize === 15 &&
    Object.keys(configDefaults).every(k => isEqual(this[k], configDefaults[k]))
  );
}

class TttrCalculator {
  constructor(calcConfigParams) {
    const { configDefaults } = TttrCalculator;

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

    const timePeriodSpec =
      this.timePeriodSpec === MEASURE_DEFAULT_TIME_PERIOD_SPEC
        ? defaultTimePeriodSpec
        : generalTimePeriodSpecs[this.timePeriodSpec];

    this.timePeriodIdentifier = createTimePeriodIdentifier(timePeriodSpec);

    this.npmrdsDataKeys = [getNpmrdsDataKey(this)];

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

    const ninetyfifthPctlTravelTimeByTimePeriod = this.isSpeedBased
      ? null
      : Object.keys(metricValuesByTimePeriod).reduce((acc, timePeriod) => {
          const v = quantileSorted(
            metricValuesByTimePeriod[timePeriod],
            NINETYFIFTH_PCTL
          );

          acc[timePeriod] = this.roundTravelTimes ? precisionRound(v) : v;
          return acc;
        }, {});

    const fifthPctlSpeedByTimePeriod = this.isSpeedBased
      ? Object.keys(metricValuesByTimePeriod).reduce((acc, timePeriod) => {
          const v = quantileSorted(
            metricValuesByTimePeriod[timePeriod],
            FIFTH_PCTL
          );

          acc[timePeriod] = this.roundTravelTimes ? precisionRound(v) : v;
          return acc;
        }, {})
      : null;

    const tttrByTimePeriod = Object.keys(metricValuesByTimePeriod).reduce(
      (acc, timePeriod) => {
        const tttr = this.isSpeedBased
          ? fiftiethPctlSpeedByTimePeriod[timePeriod] /
            fifthPctlSpeedByTimePeriod[timePeriod]
          : ninetyfifthPctlTravelTimeByTimePeriod[timePeriod] /
            fiftiethPctlTravelTimeByTimePeriod[timePeriod];

        acc[timePeriod] = this.roundTravelTimes
          ? precisionRound(tttr, 2)
          : tttr;

        return acc;
      },
      {}
    );

    const result = Object.assign(
      {
        tmc,
        npmrdsDataKey,
        tttrByTimePeriod
      },
      this.isSpeedBased
        ? { fiftiethPctlSpeedByTimePeriod, fifthPctlSpeedByTimePeriod }
        : {
            fiftiethPctlTravelTimeByTimePeriod,
            ninetyfifthPctlTravelTimeByTimePeriod
          }
    );

    return this.outputFormatter(result);
  }
}

TttrCalculator.measure = TTTR;
TttrCalculator.configDefaults = {
  meanType: ARITHMETIC,
  npmrdsDataSource: TRUCK,
  npmrdsMetric: TRAVEL_TIME,
  timePeriodSpec: MEASURE_DEFAULT_TIME_PERIOD_SPEC,
  roundTravelTimes: true
};
TttrCalculator.configOptions = {
  meanType: [ARITHMETIC, HARMONIC],
  npmrdsDataSource: npmrdsDataSources,
  npmrdsMetric: [TRAVEL_TIME, SPEED],
  timePeriodSpec: timePeriodSpecNames,
  roundTravelTimes: [true, false]
};
TttrCalculator.defaultTimePeriodSpec = defaultTimePeriodSpec;

module.exports = TttrCalculator;
