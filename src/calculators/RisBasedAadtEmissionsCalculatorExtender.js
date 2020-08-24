const _ = require('lodash');

class RisBasedAadtExcessiveDelayCalculatorExtender {
  static extendClass(parentClass) {
    class RisBasedAadtExcessiveDelayExtendedCalculator extends parentClass {
      constructor(calcConfigParams) {
        super(calcConfigParams);

        this.dirAadtTypes = this.dirAadtTypes.map(
          (aadtType) => `${aadtType}Ris`,
        );
      }

      get requiredTmcMetadata() {
        const reqMetadata = super.requiredTmcMetadata.map((prop) =>
          // prop is an aadt
          prop.match(/directionalAadt/) &&
          // & prop does not already end in Ris
          !prop.match(/Ris$/)
            ? `${prop}Ris`
            : prop,
        );

        return _.uniq(reqMetadata);
      }

      getDirAadts(attrs) {
        const {
          directionalAadtPassRis,
          directionalAadtSinglRis,
          directionalAadtCombiRis,
        } = attrs;

        return {
          passDirAadt: directionalAadtPassRis,
          singlDirAadt: directionalAadtSinglRis,
          combiDirAadt: directionalAadtCombiRis,
        };
      }
    }

    RisBasedAadtExcessiveDelayExtendedCalculator.measure = `${parentClass.measure}_RIS`;

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
