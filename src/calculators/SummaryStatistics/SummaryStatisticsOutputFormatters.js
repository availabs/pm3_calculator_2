const { lowerCase, snakeCase } = require('lodash');
const { EAV, VERBOSE } = require('../../enums/outputFormats');
const verboseFormatter = require('../../utils/verboseOutputFormatter');

function eavFormatter(output) {
  const { tmc, summaryStatsByTimePeriod } = output;

  const baseFields = {
    tmc,
    year: this.year,
    measure: this.measure,
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

module.exports = {
  [VERBOSE]: verboseFormatter,
  [EAV]: eavFormatter
};
