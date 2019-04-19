const { lowerCase, snakeCase } = require('lodash');
const { EAV } = require('../../enums/outputFormats');

const basicOutputFormatters = require('../../utils/basicOutputFormatters');

function eavFormatter(output) {
  const { tmc, summaryStatsByTimePeriod } = output;

  const baseFields = {
    tmc,
    year: this.year,
    measure: this.constructor.measure,
    time_bin_size: this.timeBinSize,
    metric: this.npmrdsMetric,
    data_source: this.npmrdsDataSource
  };

  const formatted = [];

  Object.keys(summaryStatsByTimePeriod).forEach(timePeriod => {
    const summaryStats = summaryStatsByTimePeriod[timePeriod];

    Object.keys(summaryStats).forEach(stat => {
      const k = snakeCase(lowerCase(`${timePeriod}_${stat}`));

      formatted.push(
        Object.assign({}, baseFields, {
          [k]: summaryStats[stat]
        })
      );
    });
  });

  return formatted;
}

module.exports = { [EAV]: eavFormatter, ...basicOutputFormatters };
