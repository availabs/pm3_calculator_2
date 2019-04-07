const { SPEED } = require('../../enums/npmrdsMetrics');

const {
  precisionRound,
  computeSummaryStats
} = require('../../utils/MathUtils');

const createTimePeriodIdentifier = require('../timePeriods/createTimePeriodIdentifier');

const { getNpmrdsMetricKey } = require('../../utils/NpmrdsMetricKey');

const {
  names: { MEASURE_DEFAULT_TIME_PERIOD_SPEC },
  specs: generalTimePeriodSpecs
} = require('../timePeriods/TimePeriodSpecs');

const {
  measure: SUMMARY_STATISTICS,
  configDefaults,
  defaultTimePeriodSpec
} = require('./SummaryStatisticsRules');

class SummaryStatisticsCalculator {
  constructor(calcConfigParams) {
    this.year = calcConfigParams.year;
    this.meanType = calcConfigParams.meanType;
    this.timeBinSize = calcConfigParams.timeBinSize;

    Object.keys(configDefaults).forEach(k => {
      this[k] = calcConfigParams[k] || configDefaults[k];
    });

    const timePeriodSpec =
      this.timePeriodSpec === MEASURE_DEFAULT_TIME_PERIOD_SPEC
        ? defaultTimePeriodSpec
        : generalTimePeriodSpecs[this.timePeriodSpec];

    this.timePeriodIdentifier = createTimePeriodIdentifier(timePeriodSpec);

    this.npmrdsMetricKeys = [
      getNpmrdsMetricKey({
        metric: this.npmrdsMetric,
        dataSource: this.npmrdsDataSource
      })
    ];

    this.requiredTmcAttributes =
      this.npmrdsMetric === SPEED ? ['length'] : null;
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

    const summaryStatsByTimePeriod = Object.keys(
      metricValuesByTimePeriod
    ).reduce((acc, timePeriod) => {
      const stats = computeSummaryStats(metricValuesByTimePeriod[timePeriod]);

      acc[timePeriod] = Object.keys(stats).reduce((acc2, stat) => {
        // eslint-disable-next-line no-param-reassign
        acc2[stat] = precisionRound(stats[stat], 4);
        return acc2;
      }, {});

      return acc;
    }, {});

    return {
      tmc,
      summaryStatsByTimePeriod
    };
  }
}

SummaryStatisticsCalculator.measure = SUMMARY_STATISTICS;

module.exports = SummaryStatisticsCalculator;
