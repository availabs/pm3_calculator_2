const { ALL } = require('../../enums/npmrdsDataSources');

const { PERCENT_BINS_REPORTING } = require('../MeasuresNames');

const { ARITHMETIC } = require('../../enums/meanTypes');
const { TRAVEL_TIME, SPEED } = require('../../enums/npmrdsMetrics');

const {
  names: { MEASURE_DEFAULT_TIME_PERIOD_SPEC }
} = require('../timePeriods/TimePeriodSpecs');

module.exports = {
  configDefaults: {
    measure: PERCENT_BINS_REPORTING,
    npmrdsDataSources: [ALL],
    timeBinSize: 15,
    meanType: ARITHMETIC,
    metric: TRAVEL_TIME,
    measureTimePeriodSpec: MEASURE_DEFAULT_TIME_PERIOD_SPEC
  },
  supportedNpmrdsMetrics: [TRAVEL_TIME, SPEED]
};
