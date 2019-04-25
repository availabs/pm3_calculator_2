const { snakeCase } = require('lodash');
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
    measure: this.constructor.measure
  };

  const formatted = [];

  formatted.push(
    ...Object.keys(fiftiethPctlTravelTimeByTimePeriod).map(timePeriod => ({
      ...baseFields,
      attribute: snakeCase(`${timePeriod}_50pct`),
      value: fiftiethPctlTravelTimeByTimePeriod[timePeriod]
    }))
  );

  formatted.push(
    ...Object.keys(ninetyfifthPctlTravelTimeByTimePeriod).map(timePeriod => ({
      ...baseFields,
      attribute: snakeCase(`${timePeriod}_95pct`),
      value: ninetyfifthPctlTravelTimeByTimePeriod[timePeriod]
    }))
  );

  formatted.push(
    ...Object.keys(fifthPctlSpeedByTimePeriod).map(timePeriod => ({
      ...baseFields,
      attribute: snakeCase(`${timePeriod}_5pct`),
      value: fifthPctlSpeedByTimePeriod[timePeriod]
    }))
  );

  formatted.push(
    ...Object.keys(fiftiethPctlSpeedByTimePeriod).map(timePeriod => ({
      ...baseFields,
      attribute: snakeCase(`${timePeriod}_50pct`),
      value: fiftiethPctlSpeedByTimePeriod[timePeriod]
    }))
  );

  formatted.push(
    ...Object.keys(tttrByTimePeriod).map(timePeriod => ({
      ...baseFields,
      attribute: snakeCase(`${timePeriod}`),
      value: tttrByTimePeriod[timePeriod]
    }))
  );

  return formatted;
}

module.exports = { [EAV]: eavFormatter, ...basicOutputFormatters };
