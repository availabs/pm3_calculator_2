const npmrdsDataSources = require('../../enums/npmrdsDataSources');

const { TRAVEL_TIME, SPEED } = require('../../enums/npmrdsMetrics');

const PERCENT_BINS_REPORTING = 'PERCENT_BINS_REPORTING';

const {
  names: timePeriodSpecNames,
  specs: generalTimePeriodSpecs
} = require('../timePeriods/TimePeriodSpecs');

const {
  MEASURE_DEFAULT_TIME_PERIOD_SPEC,
  PM3_TIME_PERIOD_SPEC
} = timePeriodSpecNames;

const defaultTimePeriodSpec = generalTimePeriodSpecs[PM3_TIME_PERIOD_SPEC];

module.exports = {
  measure: PERCENT_BINS_REPORTING,
  configDefaults: {
    npmrdsDataSources: [npmrdsDataSources.ALL],
    npmrdsMetric: TRAVEL_TIME,
    timePeriodSpec: MEASURE_DEFAULT_TIME_PERIOD_SPEC
  },
  configOptions: {
    npmrdsDataSources,
    npmrdsMetric: [TRAVEL_TIME, SPEED],
    timePeriodSpec: timePeriodSpecNames
  },
  defaultTimePeriodSpec
};
