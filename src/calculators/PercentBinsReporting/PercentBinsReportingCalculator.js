const {
  measure: PERCENT_BINS_REPORTING
} = require('./PercentBinsReportingRules');

const { SPEED } = require('../../enums/npmrdsMetrics');

const { precisionRound } = require('../../utils/MathUtils');

const { getNumBinsPerTimePeriodForYear } = require('../../utils/TimeUtils');

const createTimePeriodIdentifier = require('../timePeriods/createTimePeriodIdentifier');

const { getNpmrdsMetricKey } = require('../../utils/NpmrdsMetricKey');

const {
  names: { MEASURE_DEFAULT_TIME_PERIOD_SPEC },
  specs: generalTimePeriodSpecs
} = require('../timePeriods/TimePeriodSpecs');

const {
  configDefaults,
  defaultTimePeriodSpec
} = require('./PercentBinsReportingRules');

class PercentBinsReportingCalculator {
  constructor(calcConfigParams) {
    Object.keys(configDefaults).forEach(k => {
      this[k] = calcConfigParams[k] || configDefaults[k];
    });

    this.measure = PERCENT_BINS_REPORTING;

    const timePeriodSpec =
      this.timePeriodSpec === MEASURE_DEFAULT_TIME_PERIOD_SPEC
        ? defaultTimePeriodSpec
        : generalTimePeriodSpecs[this.timePeriodSpec];

    this.timePeriodIdentifier = createTimePeriodIdentifier(timePeriodSpec);

    this.numBinsPerTimePeriodForYear = getNumBinsPerTimePeriodForYear(
      this.timePeriodIdentifier
    );

    this.npmrdsMetricKeys = [
      getNpmrdsMetricKey({
        metric: this.npmrdsMetric,
        dataSource: this.npmrdsDataSources[0]
      })
    ];

    this.requiredTmcAttributes =
      this.npmrdsMetric === SPEED ? ['length'] : null;
  }

  async calculateForTmc({ data, attrs: { tmc } }) {
    const {
      npmrdsMetricKeys: [npmrdsMetricKey]
    } = this;

    const countsByTimePeriod = data.reduce((acc, row) => {
      const { [npmrdsMetricKey]: metric_value } = row;
      const timePeriod = this.timePeriodIdentifier(row);

      // console.error('==>', typeof timePeriod);
      if (timePeriod && metric_value !== null) {
        acc[timePeriod] = acc[timePeriod] || 0;
        ++acc[timePeriod];
      }

      return acc;
    }, {});

    const percentBinsReportingByTimePeriod = Object.keys(
      this.numBinsPerTimePeriodForYear
    ).reduce((acc, timePeriod) => {
      acc[timePeriod] = precisionRound(
        countsByTimePeriod[timePeriod] /
          this.numBinsPerTimePeriodForYear[timePeriod],
        3
      );
      return acc;
    }, {});

    return { tmc, percentBinsReportingByTimePeriod };
  }
}

module.exports = PercentBinsReportingCalculator;
