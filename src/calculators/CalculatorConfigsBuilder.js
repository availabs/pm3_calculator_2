const {
  cartesianProduct,
  difference,
  intersection,
  union,
  uniq
} = require('../utils/SetUtils');

const MeasureMetadata = require('./MeasureMetadata');

const { configOptions: measureConfigOptions } = MeasureMetadata;

class CalculatorConfigsBuilder {
  static buildCalculatorConfigs({
    year,
    outputFormat,
    measures,
    timeBinSize,
    meanType,
    npmrdsDataSource,
    npmrdsMetric,
    timePeriodSpec,
    measureSpecificSettings = {}
  }) {
    // The baseConfigParams are necessarily a single value.
    const baseConfigParams = { year, timeBinSize, outputFormat };

    const calculatorConfigs = measures.reduce((acc, measure) => {
      // npmrdsDataSource, npmrdsMetric, and timePeriodSpec
      //   can be specified at the global and/or measure level.
      // For these options, we need to get the set union
      //   between the global and measure-specific options.
      // Additionally, we need to filter unsupported options
      //   out of the global settings is the given measure
      //   does not support them.
      // TODO: Abstract this out so that we don't need
      //   to manually add this code for every
      //   global &/or measure-level option.
      const {
        meanType: measureSpecificMeanType,
        npmrdsDataSource: measureSpecificNpmrdsDataSource,
        npmrdsMetric: measureSpecificNpmrdsMetric,
        timePeriodSpec: measureSpecificTimePeriodSpec
      } = measureSpecificSettings[measure] || {};

      const {
        meanType: measureSupportedMeanTypes,
        npmrdsDataSource: measureSupportedNpmrdsDataSource,
        npmrdsMetric: measureSupportedNpmrdsMetric,
        timePeriodSpec: measureSupportedTimePeriodSpec
      } = measureConfigOptions[measure] || {};

      const meanTypeArr = intersection(
        union(meanType, measureSpecificMeanType),
        measureSupportedMeanTypes
      )
        .filter(mt => mt)
        .map(mt => ({ meanType: mt }));

      const npmrdsDataSourceArr = intersection(
        union(npmrdsDataSource, measureSpecificNpmrdsDataSource),
        measureSupportedNpmrdsDataSource
      )
        .filter(ds => ds)
        .map(ds => ({ npmrdsDataSource: ds }));

      const npmrdsMetricArr = intersection(
        union(npmrdsMetric, measureSpecificNpmrdsMetric),
        measureSupportedNpmrdsMetric
      )
        .filter(m => m)
        .map(m => ({ npmrdsMetric: m }));

      const timePeriodSpecArr = intersection(
        union(timePeriodSpec, measureSpecificTimePeriodSpec),
        measureSupportedTimePeriodSpec
      )
        .filter(tps => tps)
        .map(tps => ({ timePeriodSpec: tps }));

      const otherMeasureSpecificSettings = measureSpecificSettings[measure]
        ? difference(Object.keys(measureSpecificSettings[measure]), [
            'meanType',
            'npmrdsDataSource',
            'npmrdsMetric',
            'timePeriodSpec'
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
        meanTypeArr,
        npmrdsDataSourceArr,
        npmrdsMetricArr,
        timePeriodSpecArr,
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
