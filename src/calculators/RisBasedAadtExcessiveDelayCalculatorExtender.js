const _ = require('lodash');

class RisBasedAadtExcessiveDelayCalculatorExtender {
  static extendClass(parentClass) {
    class RisBasedAadtExcessiveDelayExtendedCalculator extends parentClass {
      constructor(calcConfigParams) {
        super(calcConfigParams);

        this.vehClassDirAadtTypes = this.vehClassDirAadtTypes.map(
          aadtType => `${aadtType}Ris`
        );

        this.avgVehcleOccupancyTypes = this.avgVehcleOccupancyTypes.map(
          avoType => `${avoType}Ris`
        );
      }

      get requiredTmcMetadata() {
        const reqMetadata = super.requiredTmcMetadata.map(prop =>
          prop.match(/avgVehicleOccupancy|directionalAadt/)
            ? `${prop}Ris`
            : prop
        );

        return _.uniq(reqMetadata);
      }

      getDirAadtByVehClass(attrs) {
        return this.vehClassDirAadtTypes.reduce((acc, vehClassDirAadtType) => {
          const vehClass =
            vehClassDirAadtType
              .replace(/directionalAadt|Ris/g, '')
              .toLowerCase() || 'all';

          acc[vehClass] = attrs[vehClassDirAadtType];
          return acc;
        }, {});
      }

      getAvgVehicleOccupancyByVehClass(attrs) {
        return this.avgVehcleOccupancyTypes.reduce(
          (acc, avgVehcleOccupancyType) => {
            const vehClass =
              avgVehcleOccupancyType
                .replace(/avgVehicleOccupancy|Ris/g, '')
                .toLowerCase() || 'all';

            acc[vehClass] = attrs[avgVehcleOccupancyType];

            return acc;
          },
          {}
        );
      }
    }

    RisBasedAadtExcessiveDelayExtendedCalculator.measure = `${
      parentClass.measure
    }_RIS`;

    RisBasedAadtExcessiveDelayExtendedCalculator.configDefaults =
      parentClass.configDefaults;
    RisBasedAadtExcessiveDelayExtendedCalculator.configOptions =
      parentClass.configOptions;
    RisBasedAadtExcessiveDelayExtendedCalculator.defaultTimePeriodSpec =
      parentClass.defaultTimePeriodSpec;

    return RisBasedAadtExcessiveDelayExtendedCalculator;
  }
}

module.exports = RisBasedAadtExcessiveDelayCalculatorExtender;
