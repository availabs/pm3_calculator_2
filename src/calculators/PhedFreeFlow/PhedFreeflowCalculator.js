const PhedCalculator = require('../Phed/PhedCalculator');
const FreeFlowCalculator = require('../FreeFlow/FreeFlowCalculator');

const { union } = require('../../utils/SetUtils');

const { IDENTITY } = require('../../enums/outputFormats');

const PHED_FREE_FLOW = 'PHED_FREE_FLOW';

class PhedFreeFlowCalculator extends PhedCalculator {
  constructor(calcConfigParams) {
    super(calcConfigParams);

    const freeFlowCalculator = new FreeFlowCalculator(
      Object.assign({}, calcConfigParams, { outputFormat: IDENTITY })
    );

    this.thresholdSpeedCalculator = {
      requiredTmcMetadata: union(freeFlowCalculator.requiredTmcMetadata, [
        'miles'
      ]),
      calculateThresholdSpeed: async ({ data, attrs }) => {
        const { miles } = attrs;
        const {
          fifteenthPctlTravelTime
        } = await freeFlowCalculator.calculateForTmc({
          data,
          attrs
        });

        const thresholdSpeed = (miles / fifteenthPctlTravelTime) * 3600;

        return Math.max(thresholdSpeed * 0.6, 20)
      }
    };
  }
}

PhedFreeFlowCalculator.measure = PHED_FREE_FLOW;

PhedFreeFlowCalculator.configDefaults = PhedCalculator.configDefaults;
PhedFreeFlowCalculator.configOptions = PhedCalculator.configOptions;
PhedFreeFlowCalculator.defaultTimePeriodSpec =
  PhedCalculator.defaultTimePeriodSpec;

module.exports = PhedFreeFlowCalculator;
