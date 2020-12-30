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
    xdelayHrsByTimePeriod,
    xdelayHrs,
    xdelayVehHrsByVehClassByTimePeriod,
    xdelayVehHrsByVehClass,
    xdelayPerHrsByVehClassByTimePeriod,
    xdelayPerHrsByVehClass
  } = output;

  const baseFields = {
    tmc,
    year: this.year,
    measure: this.measure
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
      attribute: snakeCase('xdelayHrs'),
      value: xdelayHrs
    }
  ];

  formatted.push(
    ...Object.keys(xdelayHrsByTimePeriod).map(timePeriod => ({
      ...baseFields,
      attribute: snakeCase(`${timePeriod}_xdelay_hrs`),
      value: xdelayHrsByTimePeriod[timePeriod]
    }))
  );

  formatted.push(
    ...Object.keys(xdelayVehHrsByVehClassByTimePeriod).reduce(
      (acc, timePeriod) => {
        const xdVehHrsByVehClass =
          xdelayVehHrsByVehClassByTimePeriod[timePeriod];

        Object.keys(xdVehHrsByVehClass).forEach(vehClass => {
          acc.push({
            ...baseFields,
            attribute: snakeCase(`${timePeriod}_${vehClass}_xdelay_vhrs`),
            value: xdVehHrsByVehClass[vehClass]
          });
        });

        return acc;
      },
      []
    )
  );

  formatted.push(
    ...Object.keys(xdelayPerHrsByVehClassByTimePeriod).reduce(
      (acc, timePeriod) => {
        const xdPerHrsByVehClass =
          xdelayPerHrsByVehClassByTimePeriod[timePeriod];

        Object.keys(xdPerHrsByVehClass).forEach(vehClass => {
          acc.push({
            ...baseFields,
            attribute: snakeCase(`${timePeriod}_${vehClass}_xdelay_phrs`),
            value: xdPerHrsByVehClass[vehClass]
          });
        });

        return acc;
      },
      []
    )
  );

  formatted.push(
    ...Object.keys(xdelayVehHrsByVehClass).map(vehicleClass => ({
      ...baseFields,
      attribute: snakeCase(`${vehicleClass}_xdelay_vhrs`),
      value: xdelayVehHrsByVehClass[vehicleClass]
    }))
  );

  formatted.push(
    ...Object.keys(xdelayPerHrsByVehClass).map(vehicleClass => ({
      ...baseFields,
      attribute: snakeCase(`${vehicleClass}_xdelay_phrs`),
      value: xdelayPerHrsByVehClass[vehicleClass]
    }))
  );

  return formatted;
}

module.exports = { [EAV]: eavFormatter, ...basicOutputFormatters };
