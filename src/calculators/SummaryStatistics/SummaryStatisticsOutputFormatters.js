const { snakeCase } = require('lodash');
const { EAV } = require('../../enums/outputFormats');

const basicOutputFormatters = require('../../utils/basicOutputFormatters');

function eavFormatter(output) {
  const { tmc, summaryStatsByTimePeriod } = output;

  const baseFields = {
    tmc,
    year: this.year,
    measure: this.constructor.measure
  };

  const formatted = [];

  Object.keys(summaryStatsByTimePeriod).forEach(timePeriod => {
    const summaryStats = summaryStatsByTimePeriod[timePeriod];

    Object.keys(summaryStats).forEach(stat => {
      formatted.push({
        ...baseFields,
        attribute: snakeCase(`${timePeriod}_${stat}`),
        value: summaryStats[stat]
      });
    });
  });

  return formatted;
}

module.exports = { [EAV]: eavFormatter, ...basicOutputFormatters };
