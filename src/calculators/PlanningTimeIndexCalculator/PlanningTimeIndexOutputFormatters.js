const { snakeCase } = require('lodash');
const { EAV } = require('../../enums/outputFormats');

const basicOutputFormatters = require('../../utils/basicOutputFormatters');

function eavFormatter(output) {
  const { tmc, pti, ptiByTimePeriod = {} } = output;

  const baseFields = {
    tmc,
    year: this.year,
    measure: this.constructor.measure
  };

  const formatted = [
    {
      ...baseFields,
      attribute: 'pti',
      value: pti
    }
  ];

  formatted.push(
    ...Object.keys(ptiByTimePeriod).map(timePeriod => ({
      ...baseFields,
      attribute: snakeCase(`${timePeriod}_pti`),
      value: ptiByTimePeriod[timePeriod]
    }))
  );

  return formatted;
}

module.exports = { [EAV]: eavFormatter, ...basicOutputFormatters };
