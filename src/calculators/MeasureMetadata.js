/* eslint import/no-dynamic-require: 0, global-require: 0 */

const impls = [
  require('./Lottr/LottrCalculator'),
  require('./PercentBinsReporting/PercentBinsReportingCalculator'),
  require('./Phed/PhedCalculator'),
  require('./PhedFreeflow/PhedFreeflowCalculator'),
  require('./SummaryStatistics/SummaryStatisticsCalculator'),
  require('./Ted/TedCalculator'),
  require('./TedFreeflow/TedFreeflowCalculator'),
  require('./TrafficDistributionFactors/TrafficDistributionFactorsCalculator'),
  require('./Tttr/TttrCalculator'),
  require('./Freeflow/FreeflowCalculator'),
  require('./TravelTimeIndexCalculator/TravelTimeIndexCalculator'),
  require('./PlanningTimeIndexCalculator/PlanningTimeIndexCalculator'),
  require('./SpeedPercentiles/SpeedPercentilesCalculator')
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
  { names: {}, impls: {}, configDefaults: {}, configOptions: {} }
);

module.exports = metadata;
