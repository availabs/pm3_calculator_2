/*
  Creates all variations of LottrCalculator instances 
    required to satisfy the requested measure calculations.
*/

const LottrCalculator = require('./LottrCalculator');

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
  measure: LOTTR,
  configOptions: { npmrdsMetric: supportedNpmrdsMetrics }
} = require('./LottrRules');

class LottrCalculatorFactory {
  static buildCalculators() {
    if (!measures.includes(LOTTR)) {
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

    const lottrNpmrdsDataSources = union(
      npmrdsDataSources,
      measureNpmrdsDataSources && measureNpmrdsDataSources[LOTTR]
    )
      .filter(ds => ds)
      .map(ds => ({ npmrdsDataSources: [ds] }));

    const lottrNpmrdsMetrics = intersection(
      union(npmrdsMetrics, measureNpmrdsMetrics && measureNpmrdsMetrics[LOTTR]),
      supportedNpmrdsMetrics
    )
      .filter(ds => ds)
      .map(npmrdsMetric => ({ npmrdsMetric }));

    // FIXME: Code smell. timePeriodSpecs goes from id to actual def.
    const lottrTimePeriodSpecs = union(
      timePeriodSpecs,
      measureTimePeriodSpecs && measureTimePeriodSpecs[LOTTR]
    )
      .filter(tps => tps)
      .map(timePeriodSpec => ({ timePeriodSpec }));

    const configParamsArr = cartesianProduct(
      [baseConfigParams],
      lottrNpmrdsDataSources,
      lottrNpmrdsMetrics,
      lottrTimePeriodSpecs
    ).map(params =>
      Array.isArray(params)
        ? Object.assign({}, ...params)
        : Object.assign({}, params)
    );

    const calculators = configParamsArr.map(
      configParams => new LottrCalculator(configParams)
    );

    return calculators;
  }
}

module.exports = LottrCalculatorFactory;
