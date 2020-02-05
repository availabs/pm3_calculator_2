const RisPhedCalculator = require('../RisPhed/RisPhedCalculator');
const FreeflowCalculator = require('../Freeflow/FreeflowCalculator');

const { union } = require('../../utils/SetUtils');

const { IDENTITY } = require('../../enums/outputFormats');

const RIS_PHED_FREEFLOW = 'RIS_PHED_FREEFLOW';

class RisPhedFreeflowCalculator extends RisPhedCalculator {
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

        return Math.max(thresholdSpeed * 0.6, 20);
      }
    };
  }
}

RisPhedFreeflowCalculator.measure = RIS_PHED_FREEFLOW;

RisPhedFreeflowCalculator.configDefaults = RisPhedCalculator.configDefaults;
RisPhedFreeflowCalculator.configOptions = RisPhedCalculator.configOptions;
RisPhedFreeflowCalculator.defaultTimePeriodSpec =
  RisPhedCalculator.defaultTimePeriodSpec;

module.exports = RisPhedFreeflowCalculator;
