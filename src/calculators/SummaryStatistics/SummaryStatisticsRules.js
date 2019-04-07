const npmrdsDataSources = Object.keys(require('../../enums/npmrdsDataSources'));

const { TRAVEL_TIME, SPEED } = require('../../enums/npmrdsMetrics');

const SUMMARY_STATISTICS = 'SUMMARY_STATISTICS';

const {
  names: timePeriodSpecNamesEnum,
  specs: generalTimePeriodSpecs
} = require('../timePeriods/TimePeriodSpecs');

const timePeriodSpecNames = Object.keys(timePeriodSpecNamesEnum);

const {
  MEASURE_DEFAULT_TIME_PERIOD_SPEC,
  PM3_TIME_PERIOD_SPEC
} = timePeriodSpecNamesEnum;

const defaultTimePeriodSpec = generalTimePeriodSpecs[PM3_TIME_PERIOD_SPEC];

module.exports = {
  measure: SUMMARY_STATISTICS,
  configDefaults: {
    npmrdsDataSource: [npmrdsDataSources.ALL],
    npmrdsMetric: TRAVEL_TIME,
    timePeriodSpec: MEASURE_DEFAULT_TIME_PERIOD_SPEC
  },
  configOptions: {
    npmrdsDataSource: npmrdsDataSources,
    npmrdsMetric: [TRAVEL_TIME, SPEED],
    timePeriodSpec: timePeriodSpecNames
  },
  defaultTimePeriodSpec
};
