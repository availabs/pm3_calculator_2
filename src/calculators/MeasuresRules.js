const { LOTTR, TTTR, PERCENT_BINS_REPORTING } = require('./MeasuresNames');

const LottrRules = require('./Lottr/LottrRules');
const TttrRules = require('./Tttr/TttrRules');
const PercentBinsReportingRules = require('./PercentBinsReporting/PercentBinsReportingRules');

module.exports = {
  [LOTTR]: LottrRules,
  [TTTR]: TttrRules,
  [PERCENT_BINS_REPORTING]: PercentBinsReportingRules
};
