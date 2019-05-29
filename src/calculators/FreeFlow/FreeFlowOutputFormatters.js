const { snakeCase } = require('lodash');
const { EAV } = require('../../enums/outputFormats');

const basicOutputFormatters = require('../../utils/basicOutputFormatters');

function eavFormatter(output) {
  const { tmc, fifteenthPctlTravelTime, eightyFifthPctlSpeed } = output;

  const baseFields = {
    tmc,
    year: this.year,
    measure: this.constructor.measure
  };

  const formatted = [];

  if (fifteenthPctlTravelTime !== undefined) {
    formatted.push({
      ...baseFields,
      attribute: snakeCase(`tt_15pct`),
      value: fifteenthPctlTravelTime
    });
  }

  if (eightyFifthPctlSpeed !== undefined) {
    formatted.push({
      ...baseFields,
      attribute: snakeCase(`speed_85pct`),
      value: eightyFifthPctlSpeed
    });
  }

  return formatted;
}

module.exports = { [EAV]: eavFormatter, ...basicOutputFormatters };
