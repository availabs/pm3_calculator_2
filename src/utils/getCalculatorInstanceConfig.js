const { pick } = require('lodash');

const globalConfigOpts = ['year', 'timeBinSize'];

const getCalculatorInstanceConfig = calculator => {
  const { measure } = calculator.constructor;
  const { isCanonical } = calculator;

  const configKeys = Object.keys(calculator.constructor.configOptions).sort();

  return Object.assign(
    {},
    { measure, isCanonical },
    pick(calculator, [...globalConfigOpts, ...configKeys])
  );
};

module.exports = getCalculatorInstanceConfig;
