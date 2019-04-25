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
    measure: this.constructor.measure
  };

  const formatted = attributeNames.map(attrName => ({
    ...baseFields,
    attribute: snakeCase(attrName),
    value: output[attrName]
  }));

  return formatted;
}

module.exports = { [EAV]: eavFormatter, ...basicOutputFormatters };
