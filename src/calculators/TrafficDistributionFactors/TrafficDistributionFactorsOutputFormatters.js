const { snakeCase } = require('lodash');
const { EAV, VERBOSE } = require('../../enums/outputFormats');
const verboseFormatter = require('../../utils/verboseOutputFormatter');

function eavFormatter(output) {
  const { tmc, trafficDistributionFactors } = output;

  const baseFields = {
    tmc,
    year: this.year,
    measure: this.constructor.measure,
    time_bin_size: this.timeBinSize,
    metric: this.npmrdsMetric,
    data_source: this.npmrdsDataSource
  };

  const formatted = [];

  formatted.push(
    ...Object.keys(trafficDistributionFactors).map(factor =>
      Object.assign({}, baseFields, {
        attribute: snakeCase(factor),
        value: trafficDistributionFactors[factor]
      })
    )
  );

  return formatted;
}

module.exports = {
  [VERBOSE]: verboseFormatter,
  [EAV]: eavFormatter
};
