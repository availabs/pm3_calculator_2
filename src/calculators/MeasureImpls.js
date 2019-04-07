/* eslint import/no-dynamic-require: 0, global-require: 0 */

const { fileSync } = require('find');

const rulesFilesPaths = fileSync(/Calculator.js/, __dirname);

module.exports = rulesFilesPaths.reduce((acc, path) => {
  const Calculator = require(path);

  const { measure } = Calculator;

  if (measure) {
    acc[measure] = Calculator;
  }

  return acc;
}, {});
