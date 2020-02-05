const RisPhedFreeflowCalculator = require('../RisPhedFreeflow/RisPhedFreeflowCalculator');
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

const RIS_TED_FREEFLOW = 'RIS_TED_FREEFLOW';

class RisTedFreeflowCalculator extends RisPhedFreeflowCalculator {
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

RisTedFreeflowCalculator.measure = RIS_TED_FREEFLOW;

RisTedFreeflowCalculator.configDefaults =
  RisPhedFreeflowCalculator.configDefaults;
RisTedFreeflowCalculator.configOptions =
  RisPhedFreeflowCalculator.configOptions;
RisTedFreeflowCalculator.defaultTimePeriodSpec = defaultTimePeriodSpec;

module.exports = RisTedFreeflowCalculator;
