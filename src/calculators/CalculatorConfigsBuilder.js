const {
  cartesianProduct,
  difference,
  intersection,
  union,
  uniq
} = require('../utils/SetUtils');

const { configOptions: measureConfigOptions } = require('./MeasureMetadata');

class CalculatorConfigsBuilder {
  static buildCalculatorConfigs({
    measures,
    timeBinSize,
    meanType,
    npmrdsDataSources,
    npmrdsMetrics,
    timePeriodSpecs,
    measureSpecificSettings
  }) {
    // The baseConfigParams are necessarily a single value.
    const baseConfigParams = {};

    if (timeBinSize) {
      baseConfigParams.timeBinSize = timeBinSize;
    }

    if (meanType) {
      baseConfigParams.meanType = meanType;
    }

    const calculatorConfigs = measures.reduce((acc, measure) => {
      // npmrdsDataSources, npmrdsMetrics, and timePeriodSpecs
      //   can be specified at the global and/or measure level.
      // For these options, we need to get the set union
      //   between the global and measure-specific options.
      // Additionally, we need to filter unsupported options
      //   out of the global settings is the given measure
      //   does not support them.
      const {
        npmrdsDataSources: measureSpecificNpmrdsDataSources,
        npmrdsMetrics: measureSpecificNpmrdsMetrics,
        timePeriodSpecs: measureSpecificTimePeriodSpecs
      } = measureSpecificSettings[measure] || {};

      const {
        npmrdsDataSource: measureSupportedNpmrdsDataSources,
        npmrdsMetric: measureSupportedNpmrdsMetrics,
        timePeriodSpec: measureSupportedTimePeriodSpecs
      } = measureConfigOptions[measure] || {};

      const npmrdsDataSourceArr = intersection(
        union(npmrdsDataSources, measureSpecificNpmrdsDataSources),
        measureSupportedNpmrdsDataSources
      )
        .filter(ds => ds)
        .map(npmrdsDataSource => ({ npmrdsDataSource }));

      const npmrdsMetricArr = intersection(
        union(npmrdsMetrics, measureSpecificNpmrdsMetrics),
        measureSupportedNpmrdsMetrics
      )
        .filter(m => m)
        .map(npmrdsMetric => ({ npmrdsMetric }));

      const timePeriodSpecsArr = intersection(
        union(timePeriodSpecs, measureSpecificTimePeriodSpecs),
        measureSupportedTimePeriodSpecs
      )
        .filter(tps => tps)
        .map(timePeriodSpec => ({ timePeriodSpec }));

      const otherMeasureSpecificSettings = measureSpecificSettings[measure]
        ? difference(Object.keys(measureSpecificSettings[measure]), [
            'npmrdsDataSources',
            'npmrdsMetrics',
            'timePeriodSpecs'
          ]).reduce((acc2, settingFlag) => {
            const settings = uniq(
              measureSpecificSettings[measure][settingFlag]
            );

            const settingConfigArr = settings.map(setting => ({
              [settingFlag]: setting
            }));

            acc2.push(settingConfigArr);

            return acc2;
          }, [])
        : [];

      const configParamsArr = cartesianProduct(
        [baseConfigParams],
        npmrdsDataSourceArr,
        npmrdsMetricArr,
        timePeriodSpecsArr,
        ...otherMeasureSpecificSettings
      ).map(params =>
        Array.isArray(params)
          ? Object.assign({}, ...params)
          : Object.assign({}, params)
      );

      acc[measure] = configParamsArr;

      return acc;
    }, {});

    return calculatorConfigs;
  }
}

module.exports = CalculatorConfigsBuilder;
