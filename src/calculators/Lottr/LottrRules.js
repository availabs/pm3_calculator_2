const _ = require('lodash');
const npmrdsDataSources = require('../../enums/npmrdsDataSources');

const { TRAVEL_TIME, SPEED } = require('../../enums/npmrdsMetrics');
const { AMP, MIDD, PMP, WE } = require('../../enums/pm3TimePeriods');

const LOTTR = 'LOTTR';

const {
  names: timePeriodSpecNames,
  specs: generalTimePeriodSpecs
} = require('../timePeriods/TimePeriodSpecs');

const {
  MEASURE_DEFAULT_TIME_PERIOD_SPEC,
  PM3_TIME_PERIOD_SPEC
} = timePeriodSpecNames;

const defaultTimePeriodSpec = _.pick(
  generalTimePeriodSpecs[PM3_TIME_PERIOD_SPEC],
  [AMP, MIDD, PMP, WE]
);

module.exports = {
  measure: LOTTR,
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
