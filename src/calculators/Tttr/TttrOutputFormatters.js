const { lowerCase, snakeCase } = require('lodash');
const { EAV } = require('../../enums/outputFormats');

const basicOutputFormatters = require('../../utils/basicOutputFormatters');

function eavFormatter(output) {
  const {
    tmc,
    fifthPctlsByTimePeriod = {},
    fiftiethPctlsByTimePeriod = {},
    ninetyFifthPctlsByTimePeriod = {},
    tttrByTimePeriod = {}
  } = output;

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
    ...Object.keys(fifthPctlsByTimePeriod).map(timePeriod =>
      Object.assign({}, baseFields, {
        [snakeCase(lowerCase(`${timePeriod}_20pct`))]: fifthPctlsByTimePeriod[
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
    ...Object.keys(ninetyFifthPctlsByTimePeriod).map(timePeriod =>
      Object.assign({}, baseFields, {
        [snakeCase(
          lowerCase(`${timePeriod}_80pct`)
        )]: ninetyFifthPctlsByTimePeriod[timePeriod]
      })
    )
  );

  formatted.push(
    ...Object.keys(tttrByTimePeriod).map(timePeriod =>
      Object.assign({}, baseFields, {
        [snakeCase(lowerCase(`${timePeriod}`))]: tttrByTimePeriod[timePeriod]
      })
    )
  );

  return formatted;
}

module.exports = { [EAV]: eavFormatter, ...basicOutputFormatters };
