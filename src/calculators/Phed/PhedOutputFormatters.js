const { lowerCase, snakeCase } = require('lodash');
const { EAV } = require('../../enums/outputFormats');

const basicOutputFormatters = require('../../utils/basicOutputFormatters');

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
    measure: this.constructor.measure,
    time_bin_size: this.timeBinSize,
    metric: this.npmrdsMetric,
    data_source: this.npmrdsDataSource
  };

  const formatted = [];

  formatted.push(
    ...Object.keys(twentiethPctlsByTimePeriod).map(timePeriod =>
      Object.assign({}, baseFields, {
        attribute: lowerCase(`${timePeriod}_20pct`),
        value: twentiethPctlsByTimePeriod[timePeriod]
      })
    )
  );

  formatted.push(
    ...Object.keys(fiftiethPctlsByTimePeriod).map(timePeriod =>
      Object.assign({}, baseFields, {
        attribute: snakeCase(lowerCase(`${timePeriod}_50pct`)),
        value: fiftiethPctlsByTimePeriod[timePeriod]
      })
    )
  );

  formatted.push(
    ...Object.keys(eightiethPctlsByTimePeriod).map(timePeriod =>
      Object.assign({}, baseFields, {
        attribute: snakeCase(lowerCase(`${timePeriod}_80pct`)),
        value: eightiethPctlsByTimePeriod[timePeriod]
      })
    )
  );

  formatted.push(
    ...Object.keys(lottrByTimePeriod).map(timePeriod =>
      Object.assign({}, baseFields, {
        attribute: snakeCase(lowerCase(`${timePeriod}`)),
        value: lottrByTimePeriod[timePeriod]
      })
    )
  );

  return formatted;
}

module.exports = { [EAV]: eavFormatter, ...basicOutputFormatters };
