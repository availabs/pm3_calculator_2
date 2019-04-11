const { pick } = require('lodash');

const globalConfigOpts = ['year', 'timeBinSize'];

const getCalculatorInstanceConfig = calculator => {
  const { measure } = calculator.constructor;
  const configKeys = Object.keys(calculator.constructor.configOptions).sort();

  return Object.assign(
    {},
    pick(calculator, [...globalConfigOpts, ...configKeys]),
    { measure }
  );
};

module.exports = getCalculatorInstanceConfig;
