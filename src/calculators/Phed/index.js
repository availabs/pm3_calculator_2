const FreeflowBasedThresholdSpeedExtender = require('../FreeflowBasedThresholdSpeedExtender');
const RisBasedAadtExcessiveDelayCalculatorExtender = require('../RisBasedAadtExcessiveDelayCalculatorExtender');

const PhedCalculator = require('./PhedCalculator');

const PhedFreeflowCalculator = FreeflowBasedThresholdSpeedExtender.extendClass(
  PhedCalculator
);

const PhedRisCalculator = RisBasedAadtExcessiveDelayCalculatorExtender.extendClass(
  PhedCalculator
);

const PhedFreeflowRisCalculator = RisBasedAadtExcessiveDelayCalculatorExtender.extendClass(
  PhedFreeflowCalculator
);

module.exports = {
  PhedCalculator,
  PhedFreeflowCalculator,
  PhedRisCalculator,
  PhedFreeflowRisCalculator
};
