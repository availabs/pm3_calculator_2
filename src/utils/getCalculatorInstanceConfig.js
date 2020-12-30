const { pick } = require('lodash');

const globalConfigOpts = ['year', 'timeBinSize'];

const getCalculatorInstanceConfig = (calculator) => {
  const measure = calculator.measure || calculator.constructor.measure;
  const { isCanonical } = calculator;

  const configKeys = Object.keys(calculator.constructor.configOptions).sort();

  return Object.assign(
    {},
    { measure, isCanonical },
    pick(calculator, [...globalConfigOpts, ...configKeys]),
  );
};

module.exports = getCalculatorInstanceConfig;
