const { lowerCase, snakeCase } = require('lodash');
const { EAV, VERBOSE } = require('../../enums/outputFormats');
const verboseFormatter = require('../../utils/verboseOutputFormatter');

function eavFormatter(output) {
  const {
    tmc,
    twentiethPctlsByTimePeriod = {},
    fiftiethPctlsByTimePeriod = {},
    eightiethPctlsByTimePeriod = {},
    lottrByTimePeriod = {}
  } = output;

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
    ...Object.keys(twentiethPctlsByTimePeriod).map(timePeriod =>
      Object.assign({}, baseFields, {
        [lowerCase(`${timePeriod}_20pct`)]: twentiethPctlsByTimePeriod[
          timePeriod
        ]
      })
    )
  );

  formatted.push(
    ...Object.keys(fiftiethPctlsByTimePeriod).map(timePeriod =>
      Object.assign({}, baseFields, {
        [snakeCase(
          lowerCase(`${timePeriod}_50pct`)
        )]: fiftiethPctlsByTimePeriod[timePeriod]
      })
    )
  );

  formatted.push(
    ...Object.keys(eightiethPctlsByTimePeriod).map(timePeriod =>
      Object.assign({}, baseFields, {
        [snakeCase(
          lowerCase(`${timePeriod}_80pct`)
        )]: eightiethPctlsByTimePeriod[timePeriod]
      })
    )
  );

  formatted.push(
    ...Object.keys(lottrByTimePeriod).map(timePeriod =>
      Object.assign({}, baseFields, {
        [snakeCase(lowerCase(`${timePeriod}`))]: lottrByTimePeriod[timePeriod]
      })
    )
  );

  return formatted;
}

module.exports = {
  [VERBOSE]: verboseFormatter,
  [EAV]: eavFormatter
};
