const RisBasedAadtExcessiveDelayCalculatorExtender = require('../RisBasedAadtExcessiveDelayCalculatorExtender');

const EmissionsCalculator = require('./EmissionsCalculator');

const EmissionsRisCalculator = RisBasedAadtExcessiveDelayCalculatorExtender.extendClass(
  EmissionsCalculator,
);

module.exports = {
  EmissionsCalculator,
  EmissionsRisCalculator,
};
