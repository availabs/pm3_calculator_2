const { lowerCase, snakeCase } = require('lodash');
const { EAV, VERBOSE } = require('../../enums/outputFormats');
const verboseFormatter = require('../../utils/verboseOutputFormatter');

function eavFormatter(output) {
  const { tmc, percentBinsReportingByTimePeriod } = output;

  const baseFields = {
    tmc,
    year: this.year,
    measure: this.measure,
    time_bin_size: this.timeBinSize,
    metric: this.npmrdsMetric,
    data_source: this.npmrdsDataSource
  };

  const formatted = [];

  formatted.push(
    ...Object.keys(percentBinsReportingByTimePeriod).map(timePeriod =>
      Object.assign({}, baseFields, {
        [snakeCase(
          lowerCase(`${timePeriod}_pct_bins_reporting`)
        )]: percentBinsReportingByTimePeriod[timePeriod]
      })
    )
  );

  return formatted;
}

module.exports = {
  [VERBOSE]: verboseFormatter,
  [EAV]: eavFormatter
};
