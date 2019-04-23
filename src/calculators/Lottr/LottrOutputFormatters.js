const { lowerCase, snakeCase } = require('lodash');
const { EAV } = require('../../enums/outputFormats');

const basicOutputFormatters = require('../../utils/basicOutputFormatters');

function eavFormatter(output) {
  const {
    tmc,
    fiftiethPctlSpeedByTimePeriod = {},
    twentiethPctlSpeedByTimePeriod = {},
    fiftiethPctlTravelTimeByTimePeriod = {},
    eightiethPctlTravelTimeByTimePeriod = {},
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
    ...Object.keys(fiftiethPctlTravelTimeByTimePeriod).map(timePeriod =>
      Object.assign({}, baseFields, {
        attribute: snakeCase(lowerCase(`${timePeriod}_50pct`)),
        value: fiftiethPctlTravelTimeByTimePeriod[timePeriod]
      })
    )
  );

  formatted.push(
    ...Object.keys(eightiethPctlTravelTimeByTimePeriod).map(timePeriod =>
      Object.assign({}, baseFields, {
        attribute: snakeCase(lowerCase(`${timePeriod}_80pct`)),
        value: eightiethPctlTravelTimeByTimePeriod[timePeriod]
      })
    )
  );

  formatted.push(
    ...Object.keys(twentiethPctlSpeedByTimePeriod).map(timePeriod =>
      Object.assign({}, baseFields, {
        attribute: snakeCase(lowerCase(`${timePeriod}_20pct`)),
        value: twentiethPctlSpeedByTimePeriod[timePeriod]
      })
    )
  );

  formatted.push(
    ...Object.keys(fiftiethPctlSpeedByTimePeriod).map(timePeriod =>
      Object.assign({}, baseFields, {
        attribute: snakeCase(lowerCase(`${timePeriod}_50pct`)),
        value: fiftiethPctlSpeedByTimePeriod[timePeriod]
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
