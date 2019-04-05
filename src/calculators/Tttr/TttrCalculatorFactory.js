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
  npmrdsDatasources,
  npmrdsMetrics,
  timePeriodSpecs,
  measureNpmrdsDatasources,
  measureNpmrdsMetrics,
  measureTimePeriodSpecs
} = require('../../calculatorSettings');

const { TTTR } = require('../MeasuresNames');

const { supportedNpmrdsMetrics } = require('./TttrRules');

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

    const tttrNpmrdsDatasources = union(
      npmrdsDatasources,
      measureNpmrdsDatasources && measureNpmrdsDatasources[TTTR]
    )
      .filter(ds => ds)
      .map(ds => ({ npmrdsDatasources: [ds] }));

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
      .map(measureTimePeriodSpec => ({ measureTimePeriodSpec }));

    const configParamsArr = cartesianProduct(
      [baseConfigParams],
      tttrNpmrdsDatasources,
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
