const _ = require('lodash');
const { EAV } = require('../../enums/outputFormats');

const basicOutputFormatters = require('../../utils/basicOutputFormatters');

function eavFormatter(output) {
  const { tmc, co2Emissions } = output;

  const formatted = _.flattenDeep(
    Object.keys(co2Emissions).map((vehicleClass) => {
      const classCO2 = co2Emissions[vehicleClass];

      return Object.keys(classCO2).map((timePeriod) => ({
        tmc,
        year: this.year,
        measure: this.constructor.measure,
        attribute: `${_.snakeCase(`${vehicleClass}_${timePeriod}`)}_co2_tonnes`,
        value: _.round(co2Emissions[vehicleClass][timePeriod], 3),
      }));
    }),
  );

  return formatted;
}

module.exports = { [EAV]: eavFormatter, ...basicOutputFormatters };
