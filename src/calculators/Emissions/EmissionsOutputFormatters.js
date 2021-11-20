const _ = require('lodash');
const { EAV } = require('../../enums/outputFormats');

const basicOutputFormatters = require('../../utils/basicOutputFormatters');

function eavFormatter(output) {
  const {
    tmc,
    co2Emissions,
    passGasolineVehicleEmissions,
    singlDieselVehicleEmissions,
    combiDieselVehicleEmissions,
    truckDieselVehicleEmissions,
  } = output;

  const co2 = Object.keys(co2Emissions).map((vehicleClass) => {
    const classCO2 = co2Emissions[vehicleClass];

    return Object.keys(classCO2).map((timePeriod) => ({
      tmc,
      year: this.year,
      measure: this.constructor.measure,
      attribute: `${_.snakeCase(`${vehicleClass}_${timePeriod}`)}_co2_tonnes`,
      value: _.round(co2Emissions[vehicleClass][timePeriod], 3),
    }));
  });

  const fuelTypeEmissions = {
    gas: {
      pass: passGasolineVehicleEmissions,
    },
    diesel: {
      combi: combiDieselVehicleEmissions,
      singl: singlDieselVehicleEmissions,
      truck: truckDieselVehicleEmissions,
    },
  };

  const byFuelType = Object.keys(fuelTypeEmissions).map((fuelType) =>
    Object.keys(fuelTypeEmissions[fuelType]).map((vehicleClass) =>
      Object.keys(fuelTypeEmissions[fuelType][vehicleClass]).map((eType) =>
        Object.keys(fuelTypeEmissions[fuelType][vehicleClass][eType]).map(
          (timePeriod) => {
            const attribute = `${_.snakeCase(
              `${fuelType}_${vehicleClass}_${timePeriod}`,
            )}_${eType}_tonnes`;

            const value = _.round(
              fuelTypeEmissions[fuelType][vehicleClass][eType][timePeriod],
              3,
            );

            return {
              tmc,
              year: this.year,
              measure: this.constructor.measure,
              attribute,
              value,
            };
          },
        ),
      ),
    ),
  );

  const formatted = _.flattenDeep([...co2, ...byFuelType]);

  return formatted;
}

module.exports = { [EAV]: eavFormatter, ...basicOutputFormatters };
