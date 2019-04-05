/*
  Creates all variations of TttrCalculator instances 
    required to satisfy the requested measure calculations.
*/

const TttrCalculator = require('./TttrCalculator');

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
  measure: TTTR,
  configOptions: { npmrdsMetric: supportedNpmrdsMetrics }
} = require('./TttrRules');

class TttrCalculatorFactory {
  static buildCalculators() {
    if (!measures.includes(TTTR)) {
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

    const tttrNpmrdsDataSources = union(
      npmrdsDataSources,
      measureNpmrdsDataSources && measureNpmrdsDataSources[TTTR]
    )
      .filter(ds => ds)
      .map(ds => ({ npmrdsDataSources: [ds] }));

    const tttrNpmrdsMetrics = intersection(
      union(npmrdsMetrics, measureNpmrdsMetrics && measureNpmrdsMetrics[TTTR]),
      supportedNpmrdsMetrics
    )
      .filter(ds => ds)
      .map(npmrdsMetric => ({ npmrdsMetric }));

    // FIXME: Code smell. timePeriodSpecs goes from id to actual def.
    const tttrTimePeriodSpecs = union(
      timePeriodSpecs,
      measureTimePeriodSpecs && measureTimePeriodSpecs[TTTR]
    )
      .filter(tps => tps)
      .map(timePeriodSpec => ({ timePeriodSpec }));

    const configParamsArr = cartesianProduct(
      [baseConfigParams],
      tttrNpmrdsDataSources,
      tttrNpmrdsMetrics,
      tttrTimePeriodSpecs
    ).map(params =>
      Array.isArray(params)
        ? Object.assign({}, ...params)
        : Object.assign({}, params)
    );

    const calculators = configParamsArr.map(
      configParams => new TttrCalculator(configParams)
    );

    return calculators;
  }
}

module.exports = TttrCalculatorFactory;
