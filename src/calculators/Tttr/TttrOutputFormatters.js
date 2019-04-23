const { lowerCase, snakeCase } = require('lodash');
const { EAV } = require('../../enums/outputFormats');

const basicOutputFormatters = require('../../utils/basicOutputFormatters');

function eavFormatter(output) {
  const {
    tmc,
    fiftiethPctlSpeedByTimePeriod = {},
    fifthPctlSpeedByTimePeriod = {},
    fiftiethPctlTravelTimeByTimePeriod = {},
    ninetyfifthPctlTravelTimeByTimePeriod = {},
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
    ...Object.keys(fiftiethPctlTravelTimeByTimePeriod).map(timePeriod =>
      Object.assign({}, baseFields, {
        attribute: snakeCase(lowerCase(`${timePeriod}_50pct`)),
        value: fiftiethPctlTravelTimeByTimePeriod[timePeriod]
      })
    )
  );

  formatted.push(
    ...Object.keys(ninetyfifthPctlTravelTimeByTimePeriod).map(timePeriod =>
      Object.assign({}, baseFields, {
        attribute: snakeCase(lowerCase(`${timePeriod}_95pct`)),
        value: ninetyfifthPctlTravelTimeByTimePeriod[timePeriod]
      })
    )
  );

  formatted.push(
    ...Object.keys(fifthPctlSpeedByTimePeriod).map(timePeriod =>
      Object.assign({}, baseFields, {
        attribute: snakeCase(lowerCase(`${timePeriod}_5pct`)),
        value: fifthPctlSpeedByTimePeriod[timePeriod]
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
    ...Object.keys(tttrByTimePeriod).map(timePeriod =>
      Object.assign({}, baseFields, {
        attribute: snakeCase(lowerCase(`${timePeriod}`)),
        value: tttrByTimePeriod[timePeriod]
      })
    )
  );

  return formatted;
}

module.exports = { [EAV]: eavFormatter, ...basicOutputFormatters };
