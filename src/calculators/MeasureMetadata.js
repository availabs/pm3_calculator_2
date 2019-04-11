/* eslint import/no-dynamic-require: 0, global-require: 0 */

const impls = [
  require('./Lottr/LottrCalculator'),
  require('./PercentBinsReporting/PercentBinsReportingCalculator'),
  require('./SummaryStatistics/SummaryStatisticsCalculator'),
  require('./TrafficDistributionFactors/TrafficDistributionFactorsCalculator'),
  require('./Tttr/TttrCalculator')
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
