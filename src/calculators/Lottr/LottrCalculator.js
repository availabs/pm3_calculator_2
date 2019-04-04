const _ = require('lodash');
const { quantileSorted } = require('simple-statistics');

const { ALL } = require('../../enums/npmrdsDatasources');

const { LOTTR } = require('../MeasuresNames');

const { ARITHMETIC } = require('../../enums/meanTypes');
const { TRAVEL_TIME, SPEED } = require('../../enums/npmrdsMetrics');

const { numbersComparator, precisionRound } = require('../../utils/MathUtils');

const TimePeriodIdentifier = require('../timePeriods/TimePeriodIdentifier');

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

class LottrCalculator {
  constructor(calcConfigParams) {
    const {
      measureRules: { configDefaults }
    } = LottrCalculator;

    Object.keys(configDefaults).forEach(k => {
      this[k] = calcConfigParams[k] || configDefaults[k];
    });

    this.measure = LOTTR;

    const timePeriodSpec =
      this.measureTimePeriodSpec === MEASURE_DEFAULT_TIME_PERIOD_SPEC
        ? lottrDefaultTimePeriodSpec
        : generalTimePeriodSpecs[this.measureTimePeriodSpec];

    this.timePeriodIdentifier = new TimePeriodIdentifier(timePeriodSpec);

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
      const { dow, hour, [npmrdsMetricKey]: metric_value } = row;

      const timeperiod = this.timePeriodIdentifier.getTimePeriod({
        dow,
        hour
      });

      if (timeperiod) {
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

LottrCalculator.measureRules = {
  configDefaults: {
    measure: LOTTR,
    npmrdsDatasources: [ALL],
    timeBinSize: 15,
    meanType: ARITHMETIC,
    metric: TRAVEL_TIME,
    measureTimePeriodSpec: MEASURE_DEFAULT_TIME_PERIOD_SPEC
  },
  supportedNpmrdsMetrics: [TRAVEL_TIME, SPEED]
};

module.exports = LottrCalculator;
