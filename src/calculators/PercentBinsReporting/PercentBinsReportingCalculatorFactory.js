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
  npmrdsDatasources,
  npmrdsMetrics,
  timePeriodSpecs,
  measureNpmrdsDatasources,
  measureNpmrdsMetrics,
  measureTimePeriodSpecs
} = require('../../calculatorSettings');

const { PERCENT_BINS_REPORTING } = require('../MeasuresNames');

const { supportedNpmrdsMetrics } = require('./PercentBinsReportingRules');

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

    const pctBinsReportingNpmrdsDatasources = union(
      npmrdsDatasources,
      measureNpmrdsDatasources &&
        measureNpmrdsDatasources[PERCENT_BINS_REPORTING]
    )
      .filter(ds => ds)
      .map(ds => ({ npmrdsDatasources: [ds] }));

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
      .map(measureTimePeriodSpec => ({ measureTimePeriodSpec }));

    const configParamsArr = cartesianProduct(
      [baseConfigParams],
      pctBinsReportingNpmrdsDatasources,
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
