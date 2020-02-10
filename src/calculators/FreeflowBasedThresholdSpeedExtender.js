const FreeflowCalculator = require('./Freeflow');

const { union } = require('../utils/SetUtils');

const { IDENTITY } = require('../enums/outputFormats');

class FreeflowBasedThresholdSpeedExtender {
  static extendClass(parentClass) {
    class FreeflowBasedThresholdSpeedExtendedCalculator extends parentClass {
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

    FreeflowBasedThresholdSpeedExtendedCalculator.measure = `${
      parentClass.measure
    }_FREEFLOW`;
    FreeflowBasedThresholdSpeedExtendedCalculator.configDefaults =
      parentClass.configDefaults;
    FreeflowBasedThresholdSpeedExtendedCalculator.configOptions =
      parentClass.configOptions;
    FreeflowBasedThresholdSpeedExtendedCalculator.defaultTimePeriodSpec =
      parentClass.defaultTimePeriodSpec;

    return FreeflowBasedThresholdSpeedExtendedCalculator;
  }
}

module.exports = FreeflowBasedThresholdSpeedExtender;
