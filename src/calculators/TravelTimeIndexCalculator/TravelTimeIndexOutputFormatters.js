const { snakeCase } = require('lodash');
const { EAV } = require('../../enums/outputFormats');

const basicOutputFormatters = require('../../utils/basicOutputFormatters');

function eavFormatter(output) {
  const { tmc, tti, ttiByTimePeriod = {} } = output;

  const baseFields = {
    tmc,
    year: this.year,
    measure: this.constructor.measure
  };

  const formatted = [
    {
      ...baseFields,
      attribute: 'tti',
      value: tti
    }
  ];

  formatted.push(
    ...Object.keys(ttiByTimePeriod).map(timePeriod => ({
      ...baseFields,
      attribute: snakeCase(`${timePeriod}_tti`),
      value: ttiByTimePeriod[timePeriod]
    }))
  );

  return formatted;
}

module.exports = { [EAV]: eavFormatter, ...basicOutputFormatters };
