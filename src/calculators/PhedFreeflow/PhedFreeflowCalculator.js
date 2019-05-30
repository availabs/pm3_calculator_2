const PhedCalculator = require('../Phed/PhedCalculator');
const FreeflowCalculator = require('../Freeflow/FreeflowCalculator');

const { union } = require('../../utils/SetUtils');

const { IDENTITY } = require('../../enums/outputFormats');

const PHED_FREEFLOW = 'PHED_FREEFLOW';

class PhedFreeflowCalculator extends PhedCalculator {
  constructor(calcConfigParams) {
    super(calcConfigParams);

    const freeflowCalculator = new FreeflowCalculator(
      Object.assign({}, calcConfigParams, { outputFormat: IDENTITY })
    );

    this.thresholdSpeedCalculator = {
      requiredTmcMetadata: union(freeflowCalculator.requiredTmcMetadata, [
        'miles'
      ]),
      calculateThresholdSpeed: async ({ data, attrs }) => {
        const { miles } = attrs;
        const {
          fifteenthPctlTravelTime
        } = await freeflowCalculator.calculateForTmc({
          data,
          attrs
        });

        const thresholdSpeed = (miles / fifteenthPctlTravelTime) * 3600;

        return Math.max(thresholdSpeed * 0.6, 20)
      }
    };
  }
}

PhedFreeflowCalculator.measure = PHED_FREEFLOW;

PhedFreeflowCalculator.configDefaults = PhedCalculator.configDefaults;
PhedFreeflowCalculator.configOptions = PhedCalculator.configOptions;
PhedFreeflowCalculator.defaultTimePeriodSpec =
  PhedCalculator.defaultTimePeriodSpec;

module.exports = PhedFreeflowCalculator;
