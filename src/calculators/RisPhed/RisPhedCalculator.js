const PhedCalculator = require('../Phed/PhedCalculator');

const { RIS_AADT } = require('../../enums/aadtSources');

const RIS_PHED = 'RIS_PHED';

class RisPhedCalculator extends PhedCalculator {
  constructor(calcConfigParams) {
    super(calcConfigParams);

    if (this.aadtSource === RIS_AADT) {
      this.vehClassDirAadtTypes = this.vehClassDirAadtTypes.map(aadtType =>
        aadtType.replace(/Aadt/, 'RisAadt')
      );
      this.avgVehcleOccupancyTypes = this.avgVehcleOccupancyTypes.map(
        aadtType => aadtType.replace(/$/, 'Ris')
      );
    }
  }

  get requiredTmcMetadata() {
    return super.requiredTmcMetadata.map(prop =>
      prop === 'avgVehicleOccupancy' ? 'avgVehicleOccupancyRis' : prop
    );
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

RisPhedCalculator.configDefaults = Object.assign(
  {},
  PhedCalculator.configDefaults,
  { aadtSource: RIS_AADT }
);
RisPhedCalculator.configOptions = Object.assign(
  {},
  PhedCalculator.configOptions,
  { aadtSource: [RIS_AADT] }
);

module.exports = RisPhedCalculator;
