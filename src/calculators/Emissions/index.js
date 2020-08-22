const RisBasedAadtEmissionsCalculatorExtender = require('../RisBasedAadtEmissionsCalculatorExtender');

const EmissionsCalculator = require('./EmissionsCalculator');

const EmissionsRisCalculator = RisBasedAadtEmissionsCalculatorExtender.extendClass(
  EmissionsCalculator,
);

module.exports = {
  EmissionsCalculator,
  EmissionsRisCalculator,
};
