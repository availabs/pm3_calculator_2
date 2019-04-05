const { quantileSorted } = require('simple-statistics');

const { year, meanType, timeBinSize } = require('../../calculatorSettings');
const { SPEED } = require('../../enums/npmrdsMetrics');

const { numbersComparator, precisionRound } = require('../../utils/MathUtils');

const createTimePeriodIdentifier = require('../timePeriods/createTimePeriodIdentifier');

const { getNpmrdsMetricKey } = require('../../utils/NpmrdsMetricKey');

const {
  names: { MEASURE_DEFAULT_TIME_PERIOD_SPEC },
  specs: generalTimePeriodSpecs
} = require('../timePeriods/TimePeriodSpecs');

const FIFTIETH_PCTL = 0.5;
const EIGHTIETH_PCTL = 0.8;

const {
  measure: LOTTR,
  configDefaults,
  defaultTimePeriodSpec
} = require('./LottrRules');

class LottrCalculator {
  constructor(calcConfigParams) {
    Object.keys(configDefaults).forEach(k => {
      this[k] = calcConfigParams[k] || configDefaults[k];
    });

    this.year = year;
    this.meanType = meanType;
    this.timeBinSize = timeBinSize;
    this.measure = LOTTR;

    const timePeriodSpecDef =
      this.timePeriodSpec === MEASURE_DEFAULT_TIME_PERIOD_SPEC
        ? defaultTimePeriodSpec
        : generalTimePeriodSpecs[this.timePeriodSpec];

    this.timePeriodIdentifier = createTimePeriodIdentifier(timePeriodSpecDef);

    this.npmrdsMetricKeys = [
      getNpmrdsMetricKey({
        metric: this.npmrdsMetric,
        dataSource: this.npmrdsDataSources[0]
      })
    ];

    this.requiredTmcAttributes = this.npmrdsMetric === SPEED ? ['length'] : null;
  }

  async calculateForTmc({ data, attrs: { tmc } }) {
    const {
      npmrdsMetricKeys: [npmrdsMetricKey]
    } = this;

    const metricValuesByTimePeriod = data.reduce((acc, row) => {
      const { [npmrdsMetricKey]: metric_value } = row;

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

module.exports = LottrCalculator;
