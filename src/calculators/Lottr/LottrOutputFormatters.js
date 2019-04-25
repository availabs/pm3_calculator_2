const { snakeCase } = require('lodash');
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
    ...Object.keys(eightiethPctlTravelTimeByTimePeriod).map(timePeriod => ({
      ...baseFields,
      attribute: snakeCase(`${timePeriod}_80pct`),
      value: eightiethPctlTravelTimeByTimePeriod[timePeriod]
    }))
  );

  formatted.push(
    ...Object.keys(twentiethPctlSpeedByTimePeriod).map(timePeriod => ({
      ...baseFields,
      attribute: snakeCase(`${timePeriod}_20pct`),
      value: twentiethPctlSpeedByTimePeriod[timePeriod]
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
    ...Object.keys(lottrByTimePeriod).map(timePeriod => ({
      ...baseFields,
      attribute: snakeCase(`${timePeriod}`),
      value: lottrByTimePeriod[timePeriod]
    }))
  );

  return formatted;
}

module.exports = { [EAV]: eavFormatter, ...basicOutputFormatters };
