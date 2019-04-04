const { LOTTR, TTTR } = require('./MeasuresNames');

const LottrCalculator = require('./Lottr/LottrCalculator');
const TttrCalculator = require('./Tttr/TttrCalculator');

module.exports = {
  [LOTTR]: LottrCalculator.measureRules,
  [TTTR]: TttrCalculator.measureRules
};
