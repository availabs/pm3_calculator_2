const { lowerCase, snakeCase } = require('lodash');
const { EAV } = require('../../enums/outputFormats');

const basicOutputFormatters = require('../../utils/basicOutputFormatters');

function eavFormatter(output) {
  const { tmc, percentBinsReportingByTimePeriod } = output;

  const baseFields = {
    tmc,
    year: this.year,
    measure: this.constructor.measure,
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

module.exports = { [EAV]: eavFormatter, ...basicOutputFormatters };
