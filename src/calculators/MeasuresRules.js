const {
  LOTTR,
  TTTR,
  PERCENT_BINS_REPORTING,
  SUMMARY_STATISTICS
} = require('./MeasuresNames');

const LottrRules = require('./Lottr/LottrRules');
const TttrRules = require('./Tttr/TttrRules');
const PercentBinsReportingRules = require('./PercentBinsReporting/PercentBinsReportingRules');
const SummaryStatisticsRules = require('./SummaryStatistics/SummaryStatisticsRules');

module.exports = {
  [LOTTR]: LottrRules,
  [TTTR]: TttrRules,
  [PERCENT_BINS_REPORTING]: PercentBinsReportingRules,
  [SUMMARY_STATISTICS]: SummaryStatisticsRules
};
