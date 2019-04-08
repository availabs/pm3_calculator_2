const _ = require('lodash');
const { quantileSorted } = require('simple-statistics');

const { TRAVEL_TIME, SPEED } = require('../../enums/npmrdsMetrics');
const { AMP, MIDD, PMP, WE } = require('../../enums/pm3TimePeriods');

const { numbersComparator, precisionRound } = require('../../utils/MathUtils');

const createTimePeriodIdentifier = require('../timePeriods/createTimePeriodIdentifier');

const { getNpmrdsDataKey } = require('../../utils/NpmrdsDataKey');

const npmrdsDataSources = Object.keys(require('../../enums/npmrdsDataSources'));

const {
  names: timePeriodSpecNamesEnum,
  specs: generalTimePeriodSpecs
} = require('../timePeriods/TimePeriodSpecs');

const timePeriodSpecNames = Object.keys(timePeriodSpecNamesEnum);

const {
  MEASURE_DEFAULT_TIME_PERIOD_SPEC,
  PM3_TIME_PERIOD_SPEC
} = timePeriodSpecNamesEnum;

const defaultTimePeriodSpec = _.pick(
  generalTimePeriodSpecs[PM3_TIME_PERIOD_SPEC],
  [AMP, MIDD, PMP, WE]
);

const LOTTR = 'LOTTR';
const FIFTIETH_PCTL = 0.5;
const EIGHTIETH_PCTL = 0.8;

class LottrCalculator {
  constructor(calcConfigParams) {
    this.year = calcConfigParams.year;
    this.meanType = calcConfigParams.meanType;
    this.timeBinSize = calcConfigParams.timeBinSize;

    Object.keys(LottrCalculator.configDefaults).forEach(k => {
      this[k] = calcConfigParams[k] || LottrCalculator.configDefaults[k];
    });

    const timePeriodSpecDef =
      this.timePeriodSpec === MEASURE_DEFAULT_TIME_PERIOD_SPEC
        ? defaultTimePeriodSpec
        : generalTimePeriodSpecs[this.timePeriodSpec];

    this.timePeriodIdentifier = createTimePeriodIdentifier(timePeriodSpecDef);

    this.npmrdsDataKeys = [getNpmrdsDataKey(this)];

    this.requiredTmcAttributes =
      this.npmrdsMetric === SPEED ? ['length'] : null;
  }

  async calculateForTmc({ data, attrs: { tmc } }) {
    const {
      npmrdsDataKeys: [npmrdsDataKey]
    } = this;

    const metricValuesByTimePeriod = data.reduce((acc, row) => {
      const { [npmrdsDataKey]: metric_value } = row;

      const timePeriod = this.timePeriodIdentifier(row);

      if (timePeriod && metric_value !== null) {
        acc[timePeriod] = acc[timePeriod] || [];
        acc[timePeriod].push(metric_value);
      }

      return acc;
    }, {});

    Object.values(metricValuesByTimePeriod).forEach(metricValues =>
      metricValues.sort(numbersComparator)
    );

    const fiftiethPctlsByTimePeriod = Object.keys(
      metricValuesByTimePeriod
    ).reduce((acc, timePeriod) => {
      acc[timePeriod] = quantileSorted(
        metricValuesByTimePeriod[timePeriod],
        FIFTIETH_PCTL
      );
      return acc;
    }, {});

    const eightiethPctlsByTimePeriod = Object.keys(
      metricValuesByTimePeriod
    ).reduce((acc, timePeriod) => {
      acc[timePeriod] = quantileSorted(
        metricValuesByTimePeriod[timePeriod],
        EIGHTIETH_PCTL
      );
      return acc;
    }, {});

    const lottrByTimePeriod = Object.keys(metricValuesByTimePeriod).reduce(
      (acc, timePeriod) => {
        const fiftiethPctl = fiftiethPctlsByTimePeriod[timePeriod];
        const eightiethPctl = eightiethPctlsByTimePeriod[timePeriod];

        acc[timePeriod] = precisionRound(eightiethPctl / fiftiethPctl, 2);
        return acc;
      },
      {}
    );

    const eightiethPctlsByTimePeriodRounded = Object.keys(
      eightiethPctlsByTimePeriod
    ).reduce((acc, timePeriod) => {
      acc[timePeriod] = precisionRound(eightiethPctlsByTimePeriod[timePeriod]);
      return acc;
    }, {});

    const fiftiethPctlsByTimePeriodRounded = Object.keys(
      fiftiethPctlsByTimePeriod
    ).reduce((acc, timePeriod) => {
      acc[timePeriod] = precisionRound(fiftiethPctlsByTimePeriod[timePeriod]);
      return acc;
    }, {});

    return {
      tmc,
      eightiethPctlsByTimePeriod: eightiethPctlsByTimePeriodRounded,
      fiftiethPctlsByTimePeriod: fiftiethPctlsByTimePeriodRounded,
      lottrByTimePeriod
    };
  }
}

LottrCalculator.measure = LOTTR;
LottrCalculator.configDefaults = {
  npmrdsDataSource: [npmrdsDataSources.ALL],
  npmrdsMetric: TRAVEL_TIME,
  timePeriodSpec: MEASURE_DEFAULT_TIME_PERIOD_SPEC
};
LottrCalculator.configOptions = {
  npmrdsDataSource: npmrdsDataSources,
  npmrdsMetric: [TRAVEL_TIME, SPEED],
  timePeriodSpec: timePeriodSpecNames
};
LottrCalculator.defaultTimePeriodSpec = defaultTimePeriodSpec;

module.exports = LottrCalculator;
