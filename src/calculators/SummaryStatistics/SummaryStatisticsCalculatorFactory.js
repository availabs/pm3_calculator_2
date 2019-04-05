/*
  Creates all variations of SummaryStatisticsCalculator instances 
    required to satisfy the requested measure calculations.
*/

const SummaryStatisticsCalculator = require('./SummaryStatisticsCalculator');

const {
  cartesianProduct,
  intersection,
  union
} = require('../../utils/SetUtils');

const {
  measures,
  timeBinSize,
  meanType,
  npmrdsDataSources,
  npmrdsMetrics,
  timePeriodSpecs,
  measureNpmrdsDataSources,
  measureNpmrdsMetrics,
  measureTimePeriodSpecs
} = require('../../calculatorSettings');

const { SUMMARY_STATISTICS } = require('../MeasuresNames');

const { supportedNpmrdsMetrics } = require('./SummaryStatisticsRules');

class SummaryStatisticsCalculatorFactory {
  static buildCalculators() {
    if (!measures.includes(SUMMARY_STATISTICS)) {
      return null;
    }
    // The baseConfigParams are necessarily a single value.
    const baseConfigParams = {};

    if (timeBinSize) {
      baseConfigParams.timeBinSize = timeBinSize;
    }

    if (meanType) {
      baseConfigParams.meanType = meanType;
    }

    const summaryStatsNpmrdsDataSources = union(
      npmrdsDataSources,
      measureNpmrdsDataSources && measureNpmrdsDataSources[SUMMARY_STATISTICS]
    )
      .filter(ds => ds)
      .map(ds => ({ npmrdsDataSources: [ds] }));

    const summaryStatsNpmrdsMetrics = intersection(
      union(
        npmrdsMetrics,
        measureNpmrdsMetrics && measureNpmrdsMetrics[SUMMARY_STATISTICS]
      ),
      supportedNpmrdsMetrics
    )
      .filter(ds => ds)
      .map(npmrdsMetric => ({ npmrdsMetric }));

    // FIXME: Code smell. timePeriodSpecs goes from id to actual def.
    const summaryStatsTimePeriodSpecs = union(
      timePeriodSpecs,
      measureTimePeriodSpecs && measureTimePeriodSpecs[SUMMARY_STATISTICS]
    )
      .filter(tps => tps)
      .map(measureTimePeriodSpec => ({ measureTimePeriodSpec }));

    const configParamsArr = cartesianProduct(
      [baseConfigParams],
      summaryStatsNpmrdsDataSources,
      summaryStatsNpmrdsMetrics,
      summaryStatsTimePeriodSpecs
    ).map(params =>
      Array.isArray(params)
        ? Object.assign({}, ...params)
        : Object.assign({}, params)
    );

    const calculators = configParamsArr.map(
      configParams => new SummaryStatisticsCalculator(configParams)
    );

    return calculators;
  }
}

module.exports = SummaryStatisticsCalculatorFactory;
