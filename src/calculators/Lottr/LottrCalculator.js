const _ = require('lodash');
const { quantileSorted } = require('simple-statistics');

const { LOTTR } = require('../MeasuresNames');

const { SPEED } = require('../../enums/npmrdsMetrics');

const { numbersComparator, precisionRound } = require('../../utils/MathUtils');

const createTimePeriodIdentifier = require('../timePeriods/createTimePeriodIdentifier');

const { getNpmrdsMetricKey } = require('../../utils/NpmrdsMetricKey');

const { AMP, MIDD, PMP, WE } = require('../../enums/pm3TimePeriods');

const {
  names: { MEASURE_DEFAULT_TIME_PERIOD_SPEC, PM3_TIME_PERIOD_SPEC },
  specs: generalTimePeriodSpecs
} = require('../timePeriods/TimePeriodSpecs');

const lottrDefaultTimePeriodSpec = _.pick(
  generalTimePeriodSpecs[PM3_TIME_PERIOD_SPEC],
  [AMP, MIDD, PMP, WE]
);

const FIFTIETH_PCTL = 0.5;
const EIGHTIETH_PCTL = 0.8;

const { configDefaults } = require('./LottrRules');

class LottrCalculator {
  constructor(calcConfigParams) {
    Object.keys(configDefaults).forEach(k => {
      this[k] = calcConfigParams[k] || configDefaults[k];
    });

    this.measure = LOTTR;

    const timePeriodSpec =
      this.measureTimePeriodSpec === MEASURE_DEFAULT_TIME_PERIOD_SPEC
        ? lottrDefaultTimePeriodSpec
        : generalTimePeriodSpecs[this.measureTimePeriodSpec];

    this.timePeriodIdentifier = createTimePeriodIdentifier(timePeriodSpec);

    this.npmrdsMetricKeys = [
      getNpmrdsMetricKey({
        metric: this.metric,
        datasource: this.npmrdsDatasources[0]
      })
    ];

    this.requiredTmcAttributes = this.metric === SPEED ? ['length'] : null;
  }

  async calculateForTmc({ data, attrs: { tmc } }) {
    const {
      npmrdsMetricKeys: [npmrdsMetricKey]
    } = this;

    const metricValuesByTimePeriod = data.reduce((acc, row) => {
      const { [npmrdsMetricKey]: metric_value } = row;

      const timeperiod = this.timePeriodIdentifier(row);

      if (timeperiod && metric_value !== null) {
        acc[timeperiod] = acc[timeperiod] || [];
        acc[timeperiod].push(metric_value);
      }

      return acc;
    }, {});

    Object.values(metricValuesByTimePeriod).forEach(metricValues =>
      metricValues.sort(numbersComparator)
    );

    const fiftiethPctlsByTimePeriod = Object.keys(
      metricValuesByTimePeriod
    ).reduce((acc, timeperiod) => {
      acc[timeperiod] = quantileSorted(
        metricValuesByTimePeriod[timeperiod],
        FIFTIETH_PCTL
      );
      return acc;
    }, {});

    const eightiethPctlsByTimePeriod = Object.keys(
      metricValuesByTimePeriod
    ).reduce((acc, timeperiod) => {
      acc[timeperiod] = quantileSorted(
        metricValuesByTimePeriod[timeperiod],
        EIGHTIETH_PCTL
      );
      return acc;
    }, {});

    const lottrByTimePeriod = Object.keys(metricValuesByTimePeriod).reduce(
      (acc, timeperiod) => {
        const fiftiethPctl = fiftiethPctlsByTimePeriod[timeperiod];
        const eightiethPctl = eightiethPctlsByTimePeriod[timeperiod];

        acc[timeperiod] = precisionRound(eightiethPctl / fiftiethPctl, 2);
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
