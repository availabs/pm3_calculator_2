/*
  Creates all variations of PercentBinsReportingCalculator instances 
    required to satisfy the requested measure calculations.
*/

const PercentBinsReportingCalculator = require('./PercentBinsReportingCalculator');

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

const {
  measure: PERCENT_BINS_REPORTING,
  configOptions: { npmrdsMetric: supportedNpmrdsMetrics }
} = require('./PercentBinsReportingRules');

class PercentBinsReportingCalculatorFactory {
  static buildCalculators() {
    if (!measures.includes(PERCENT_BINS_REPORTING)) {
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

    const pctBinsReportingNpmrdsDataSources = union(
      npmrdsDataSources,
      measureNpmrdsDataSources &&
        measureNpmrdsDataSources[PERCENT_BINS_REPORTING]
    )
      .filter(ds => ds)
      .map(ds => ({ npmrdsDataSources: [ds] }));

    const pctBinsReportingNpmrdsMetrics = intersection(
      union(
        npmrdsMetrics,
        measureNpmrdsMetrics && measureNpmrdsMetrics[PERCENT_BINS_REPORTING]
      ),
      supportedNpmrdsMetrics
    )
      .filter(ds => ds)
      .map(npmrdsMetric => ({ npmrdsMetric }));

    // FIXME: Code smell. timePeriodSpecs goes from id to actual def.
    const pctBinsReportingTimePeriodSpecs = union(
      timePeriodSpecs,
      measureTimePeriodSpecs && measureTimePeriodSpecs[PERCENT_BINS_REPORTING]
    )
      .filter(tps => tps)
      .map(timePeriodSpec => ({ timePeriodSpec }));

    const configParamsArr = cartesianProduct(
      [baseConfigParams],
      pctBinsReportingNpmrdsDataSources,
      pctBinsReportingNpmrdsMetrics,
      pctBinsReportingTimePeriodSpecs
    ).map(params =>
      Array.isArray(params)
        ? Object.assign({}, ...params)
        : Object.assign({}, params)
    );

    const calculators = configParamsArr.map(
      configParams => new PercentBinsReportingCalculator(configParams)
    );

    return calculators;
  }
}

module.exports = PercentBinsReportingCalculatorFactory;
