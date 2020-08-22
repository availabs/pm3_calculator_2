/* eslint-disable global-require */

const _ = require('lodash');

const impls = [
  ..._.values(require('./Lottr')),
  ..._.values(require('./PercentBinsReporting')),
  ..._.values(require('./Phed')),
  ..._.values(require('./SummaryStatistics')),
  ..._.values(require('./Ted')),
  ..._.values(require('./TrafficDistributionFactors')),
  ..._.values(require('./Tttr')),
  ..._.values(require('./Freeflow')),
  ..._.values(require('./TravelTimeIndexCalculator')),
  ..._.values(require('./PlanningTimeIndexCalculator')),
  ..._.values(require('./SpeedPercentiles')),
  ..._.values(require('./Emissions')),
];

const metadata = impls.reduce(
  (acc, impl) => {
    const { measure, configDefaults, configOptions } = impl;

    if (measure) {
      acc.names[measure] = measure;
      acc.impls[measure] = impl;
      acc.configDefaults[measure] = configDefaults || null;
      acc.configOptions[measure] = configOptions || null;
    }

    return acc;
  },
  { names: {}, impls: {}, configDefaults: {}, configOptions: {} },
);

module.exports = metadata;
