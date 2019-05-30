const PhedFreeflowCalculator = require('../PhedFreeFlow/PhedFreeflowCalculator')
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

const TED_FREEFLOW = 'TED_FREEFLOW';

class TedFreeflowCalculator extends PhedFreeflowCalculator {
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

TedFreeflowCalculator.measure = TED_FREEFLOW;

TedFreeflowCalculator.configDefaults = PhedFreeflowCalculator.configDefaults;
TedFreeflowCalculator.configOptions = PhedFreeflowCalculator.configOptions;
TedFreeflowCalculator.defaultTimePeriodSpec = defaultTimePeriodSpec;

module.exports = TedFreeflowCalculator;
