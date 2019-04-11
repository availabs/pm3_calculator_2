const { camelCase, lowerCase } = require('lodash');
const getCalculatorInstanceConfig = require('../../../utils/getCalculatorInstanceConfig');

const getCalculatorInstanceOutputFileName = ({
  calculator,
  outputTimestamp,
  outputFileFormat
}) => {
  const { measure } = calculator.constructor;

  const config = getCalculatorInstanceConfig(calculator);

  const filename = `${Object.keys(config)
    .filter(k => k !== 'measure')
    .sort()
    .reduce(
      (acc, k) => `${acc}_${camelCase(k)}-${camelCase(calculator[k])}`,
      camelCase(lowerCase(measure))
    )}.${outputTimestamp}.${lowerCase(outputFileFormat)}`;

  return filename;
};

module.exports = getCalculatorInstanceOutputFileName;
