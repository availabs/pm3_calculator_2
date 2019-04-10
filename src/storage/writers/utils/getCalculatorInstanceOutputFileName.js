const { camelCase, lowerCase } = require('lodash');
const getCalculatorInstanceConfig = require('../../../utils/getCalculatorInstanceConfig');

const getCalculatorInstanceOutputFileName = calculator => {
  const { measure } = calculator.constructor;

  const config = getCalculatorInstanceConfig(calculator);

  const filename = Object.keys(config)
    .sort()
    .reduce(
      (acc, k) => `${acc}_${camelCase(k)}-${camelCase(calculator[k])}`,
      camelCase(lowerCase(measure))
    );

  return filename;
};

module.exports = getCalculatorInstanceOutputFileName;
