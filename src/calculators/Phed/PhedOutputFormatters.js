const { snakeCase } = require('lodash');
const { EAV } = require('../../enums/outputFormats');

const basicOutputFormatters = require('../../utils/basicOutputFormatters');

function eavFormatter(output) {
  const {
    tmc,
    thresholdSpeed,
    thresholdTravelTimeSec,
    congestionLevel,
    directionality,
    dirAadtByVehClass,
    avgVehicleOccupancyByVehClass,
    xDelayHrsByTimePeriod,
    totalXDelayHrs,
    xDelayVehHrsByVehClassByTimePeriod,
    totalXDelayVehHrsByVehClass,
    xDelayPerHrsByVehClassByTimePeriod,
    totalXDelayPerHrsByVehClass
  } = output;

  const baseFields = {
    tmc,
    year: this.year,
    measure: this.constructor.measure
  };

  const formatted = [
    {
      ...baseFields,
      attribute: snakeCase('thresholdSpeed'),
      value: thresholdSpeed
    },
    {
      ...baseFields,
      attribute: snakeCase('thresholdTravelTimeSec'),
      value: thresholdTravelTimeSec
    },
    {
      ...baseFields,
      attribute: snakeCase('congestionLevel'),
      value: congestionLevel
    },
    {
      ...baseFields,
      attribute: snakeCase('directionality'),
      value: directionality
    },
    {
      ...baseFields,
      attribute: snakeCase('totalXDelayHrs'),
      value: totalXDelayHrs
    }
  ];

  formatted.push(
    ...Object.keys(dirAadtByVehClass).map(vehicleClass =>
      Object.assign({}, baseFields, {
        attribute: snakeCase(`${vehicleClass}_dir_aadt`),
        value: dirAadtByVehClass[vehicleClass]
      })
    )
  );

  formatted.push(
    ...Object.keys(avgVehicleOccupancyByVehClass).map(vehicleClass => ({
      ...baseFields,
      attribute: snakeCase(`${vehicleClass}_occ_fac`),
      value: avgVehicleOccupancyByVehClass[vehicleClass]
    }))
  );

  formatted.push(
    ...Object.keys(xDelayHrsByTimePeriod).map(timePeriod => ({
      ...baseFields,
      attribute: snakeCase(`${timePeriod}_xdelay_hrs`),
      value: xDelayHrsByTimePeriod[timePeriod]
    }))
  );

  formatted.push(
    ...Object.keys(xDelayVehHrsByVehClassByTimePeriod).reduce(
      (acc, timePeriod) => {
        const xDelayVehHrsByVehClass =
          xDelayVehHrsByVehClassByTimePeriod[timePeriod];

        Object.keys(xDelayVehHrsByVehClass).forEach(vehClass => {
          acc.push({
            ...baseFields,
            attribute: snakeCase(`${timePeriod}_${vehClass}_xdelay_vhrs`),
            value: xDelayVehHrsByVehClass[vehClass]
          });
        });

        return acc;
      },
      []
    )
  );

  formatted.push(
    ...Object.keys(xDelayPerHrsByVehClassByTimePeriod).reduce(
      (acc, timePeriod) => {
        const xDelayPerHrsByVehClass =
          xDelayPerHrsByVehClassByTimePeriod[timePeriod];

        Object.keys(xDelayPerHrsByVehClass).forEach(vehClass => {
          acc.push({
            ...baseFields,
            attribute: snakeCase(`${timePeriod}_${vehClass}_xdelay_phrs`),
            value: xDelayPerHrsByVehClass[vehClass]
          });
        });

        return acc;
      },
      []
    )
  );

  formatted.push(
    ...Object.keys(totalXDelayVehHrsByVehClass).map(vehicleClass => ({
      ...baseFields,
      attribute: snakeCase(`${vehicleClass}_xdelay_vhrs`),
      value: totalXDelayVehHrsByVehClass[vehicleClass]
    }))
  );

  formatted.push(
    ...Object.keys(totalXDelayPerHrsByVehClass).map(vehicleClass => ({
      ...baseFields,
      attribute: snakeCase(`${vehicleClass}_xdelay_phrs`),
      value: totalXDelayPerHrsByVehClass[vehicleClass]
    }))
  );

  return formatted;
}

module.exports = { [EAV]: eavFormatter, ...basicOutputFormatters };
