const PhedCalculator = require('../Phed/PhedCalculator');

const RIS_PHED = 'RIS_PHED';

class RisPhedCalculator extends PhedCalculator {
  constructor(calcConfigParams) {
    super(calcConfigParams);

    this.vehClassDirAadtTypes = this.vehClassDirAadtTypes.map(aadtType =>
      aadtType.replace(/Aadt/, 'RisAadt')
    );
    this.avgVehcleOccupancyTypes = this.avgVehcleOccupancyTypes.map(aadtType =>
      aadtType.replace(/$/, 'Ris')
    );
  }

  get requiredTmcMetadata() {
    return super.requiredTmcMetadata.map(prop => {
      if (prop === 'avgVehicleOccupancy') {
        return 'avgVehicleOccupancyRis';
      }

      if (prop === 'directionalAadt') {
        return 'directionalRisAadt';
      }

      return prop;
    });
  }

  getDirAadtByVehClass(attrs) {
    return this.vehClassDirAadtTypes.reduce((acc, vehClassDirAadtType) => {
      const vehClass =
        vehClassDirAadtType.replace(/directionalRisAadt/, '').toLowerCase() ||
        'all';

      acc[vehClass] = attrs[vehClassDirAadtType];
      return acc;
    }, {});
  }

  getAvgVehicleOccupancyByVehClass(attrs) {
    return this.avgVehcleOccupancyTypes.reduce(
      (acc, avgVehcleOccupancyType) => {
        const vehClass =
          avgVehcleOccupancyType
            .replace(/avgVehicleOccupancy/, '')
            .replace(/Ris$/, '')
            .toLowerCase() || 'all';

        acc[vehClass] = attrs[avgVehcleOccupancyType];

        return acc;
      },
      {}
    );
  }
}

RisPhedCalculator.measure = RIS_PHED;

module.exports = RisPhedCalculator;
