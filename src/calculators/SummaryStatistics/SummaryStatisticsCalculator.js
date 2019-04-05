const _ = require('lodash');

const { SUMMARY_STATISTICS } = require('../MeasuresNames');

const { SPEED } = require('../../enums/npmrdsMetrics');

const {
  precisionRound,
  computeSummaryStats
} = require('../../utils/MathUtils');

const createTimePeriodIdentifier = require('../timePeriods/createTimePeriodIdentifier');

const { getNpmrdsMetricKey } = require('../../utils/NpmrdsMetricKey');

const {
  names: { MEASURE_DEFAULT_TIME_PERIOD_SPEC, PM3_TIME_PERIOD_SPEC },
  specs: generalTimePeriodSpecs
} = require('../timePeriods/TimePeriodSpecs');

const summaryStatsDefaultTimePeriodSpec =
  generalTimePeriodSpecs[PM3_TIME_PERIOD_SPEC];

const { configDefaults } = require('./SummaryStatisticsRules');

class SummaryStatisticsCalculator {
  constructor(calcConfigParams) {
    Object.keys(configDefaults).forEach(k => {
      this[k] = calcConfigParams[k] || configDefaults[k];
    });

    this.measure = SUMMARY_STATISTICS;

    const timePeriodSpec =
      this.measureTimePeriodSpec === MEASURE_DEFAULT_TIME_PERIOD_SPEC
        ? summaryStatsDefaultTimePeriodSpec
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

    const summaryStatsByTimePeriod = Object.keys(
      metricValuesByTimePeriod
    ).reduce((acc, timeperiod) => {
      const stats = computeSummaryStats(metricValuesByTimePeriod[timeperiod]);

      acc[timeperiod] = Object.keys(stats).reduce((acc2, stat) => {
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

module.exports = SummaryStatisticsCalculator;
