const { pick } = require('lodash');

const getCalculatorInstanceConfig = calculator => {
  const configKeys = Object.keys(calculator.constructor.configOptions).sort();

  return pick(calculator, configKeys);
};

module.exports = getCalculatorInstanceConfig;
