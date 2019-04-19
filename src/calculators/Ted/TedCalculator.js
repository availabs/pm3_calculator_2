const PhedCalculator = require('../Phed/PhedCalculator');

const createTimePeriodIdentifier = require('../timePeriods/createTimePeriodIdentifier');

const {
  names: timePeriodSpecNamesEnum,
  specs: generalTimePeriodSpecs
} = require('../timePeriods/TimePeriodSpecs');

const {
  MEASURE_DEFAULT_TIME_PERIOD_SPEC,
  TOTAL_TIME_PERIOD_SPEC
} = timePeriodSpecNamesEnum;

const defaultTimePeriodSpec = generalTimePeriodSpecs[TOTAL_TIME_PERIOD_SPEC];

const TED = 'TED';

class TedCalculator extends PhedCalculator {
  constructor(calcConfigParams) {
    super(calcConfigParams);

    if (this.timePeriodSpec === MEASURE_DEFAULT_TIME_PERIOD_SPEC) {
      this.timePeriodSpecDef = defaultTimePeriodSpec;
      this.timePeriodIdentifier = createTimePeriodIdentifier(
        defaultTimePeriodSpec
      );
    }
  }
}

TedCalculator.measure = TED;

TedCalculator.configDefaults = PhedCalculator.configDefaults;
TedCalculator.configOptions = PhedCalculator.configOptions;
TedCalculator.defaultTimePeriodSpec = defaultTimePeriodSpec;

module.exports = TedCalculator;
