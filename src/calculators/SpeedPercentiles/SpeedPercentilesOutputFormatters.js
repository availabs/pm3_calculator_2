const { snakeCase } = require('lodash');
const { EAV } = require('../../enums/outputFormats');

const basicOutputFormatters = require('../../utils/basicOutputFormatters');

function eavFormatter(output) {
  const { tmc, speedPercentilesByTimePeriod } = output;

  const baseFields = {
    tmc,
    year: this.year,
    measure: this.constructor.measure
  };

  const formatted = [];

  const percentiles = Object.keys(speedPercentilesByTimePeriod);

  for (let i = 0; i < percentiles.length; ++i) {
    const pctl = percentiles[i];
    const byTimePeriod = speedPercentilesByTimePeriod[pctl];

    const timePeriods = Object.keys(byTimePeriod);

    for (let j = 0; j < timePeriods.length; ++j) {
      const timePeriod = timePeriods[j];

      formatted.push({
        ...baseFields,
        attribute: snakeCase(`${timePeriod}_${pctl}pctl_speed`),
        value: byTimePeriod[timePeriod]
      });
    }
  }

  return formatted;
}

module.exports = { [EAV]: eavFormatter, ...basicOutputFormatters };
