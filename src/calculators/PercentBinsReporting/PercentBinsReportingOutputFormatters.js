const { snakeCase } = require('lodash');
const { EAV } = require('../../enums/outputFormats');

const basicOutputFormatters = require('../../utils/basicOutputFormatters');

function eavFormatter(output) {
  const {
    tmc,
    totalPercentBinsReporting,
    percentBinsReportingByTimePeriod
  } = output;

  const baseFields = {
    tmc,
    year: this.year,
    measure: this.constructor.measure
  };

  const formatted = [
    {
      ...baseFields,
      attribute: 'pct_bins_reporting',
      value: totalPercentBinsReporting
    }
  ];

  formatted.push(
    ...Object.keys(percentBinsReportingByTimePeriod).map(timePeriod => ({
      ...baseFields,
      attribute: snakeCase(`${timePeriod}_pct_bins_reporting`),
      value: percentBinsReportingByTimePeriod[timePeriod]
    }))
  );

  return formatted;
}

module.exports = { [EAV]: eavFormatter, ...basicOutputFormatters };
