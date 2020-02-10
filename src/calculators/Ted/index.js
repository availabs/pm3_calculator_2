const FreeflowBasedThresholdSpeedExtender = require('../FreeflowBasedThresholdSpeedExtender');
const RisBasedAadtExcessiveDelayCalculatorExtender = require('../RisBasedAadtExcessiveDelayCalculatorExtender');

const TedCalculator = require('./TedCalculator');

const TedFreeflowCalculator = FreeflowBasedThresholdSpeedExtender.extendClass(
  TedCalculator
);

const TedRisCalculator = RisBasedAadtExcessiveDelayCalculatorExtender.extendClass(
  TedCalculator
);

const TedFreeflowRisCalculator = RisBasedAadtExcessiveDelayCalculatorExtender.extendClass(
  TedFreeflowCalculator
);

module.exports = {
  TedCalculator,
  TedFreeflowCalculator,
  TedRisCalculator,
  TedFreeflowRisCalculator
};
