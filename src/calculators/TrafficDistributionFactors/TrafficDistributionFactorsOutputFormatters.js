const { snakeCase } = require('lodash');
const { EAV } = require('../../enums/outputFormats');

const basicOutputFormatters = require('../../utils/basicOutputFormatters');

const attributeNames = [
  'speedReductionFactor',
  'peakSpeedDifferential',
  'tmcCongestionLevel',
  'tmcDirectionality'
];

function eavFormatter(output) {
  const { tmc } = output;

  const baseFields = {
    tmc,
    year: this.year,
    measure: this.constructor.measure,
    time_bin_size: this.timeBinSize,
    metric: this.npmrdsMetric,
    data_source: this.npmrdsDataSource
  };

  const formatted = attributeNames.map(attrName =>
    Object.assign({}, baseFields, {
      attribute: snakeCase(attrName),
      value: output[attrName]
    })
  );

  return formatted;
}

module.exports = { [EAV]: eavFormatter, ...basicOutputFormatters };
