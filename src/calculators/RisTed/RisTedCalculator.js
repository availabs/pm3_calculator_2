const RisPhedCalculator = require('../RisPhed/RisPhedCalculator');

const createTimePeriodIdentifier = require('../timePeriods/createTimePeriodIdentifier');

const {
  names: timePeriodSpecNamesEnum,
  specs: generalTimePeriodSpecs
} = require('../timePeriods/TimePeriodSpecs');

const { listTimePeriodsInSpec } = require('../timePeriods/timePeriodUtils');

const {
  MEASURE_DEFAULT_TIME_PERIOD_SPEC,
  TOTAL_TIME_PERIOD_SPEC
} = timePeriodSpecNamesEnum;

const defaultTimePeriodSpec = generalTimePeriodSpecs[TOTAL_TIME_PERIOD_SPEC];

const RIS_TED = 'RIS_TED';

class RisTedCalculator extends RisPhedCalculator {
  constructor(calcConfigParams) {
    super(calcConfigParams);

    if (this.timePeriodSpec === MEASURE_DEFAULT_TIME_PERIOD_SPEC) {
      this.timePeriodSpecDef = defaultTimePeriodSpec;
      this.timePeriodIdentifier = createTimePeriodIdentifier(
        defaultTimePeriodSpec
      );

      this.timePeriods = listTimePeriodsInSpec(this.timePeriodSpecDef);
    }
  }
}

RisTedCalculator.measure = RIS_TED;

RisTedCalculator.configDefaults = RisPhedCalculator.configDefaults;
RisTedCalculator.configOptions = RisPhedCalculator.configOptions;
RisTedCalculator.defaultTimePeriodSpec = defaultTimePeriodSpec;

module.exports = RisTedCalculator;
