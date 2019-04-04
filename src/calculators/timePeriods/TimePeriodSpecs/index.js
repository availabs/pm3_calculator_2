const MEASURE_DEFAULT_TIME_PERIOD_SPEC = 'MEASURE_DEFAULT_TIME_PERIOD_SPEC';
const PM3_TIME_PERIOD_SPEC = 'PM3_TIME_PERIOD_SPEC';
const PM3_ALT_PEAKS_TIME_PERIOD_SPEC = 'PM3_ALT_PEAKS_TIME_PERIOD_SPEC';

const PM3TimePeriodSpec = require('./PM3TimePeriodSpec');
const PM3AltPeaksTimePeriodSpec = require('./PM3AltPeaksTimePeriodSpec');

module.exports = {
  names: {
    MEASURE_DEFAULT_TIME_PERIOD_SPEC,
    PM3_TIME_PERIOD_SPEC,
    PM3_ALT_PEAKS_TIME_PERIOD_SPEC
  },
  specs: {
    [PM3_TIME_PERIOD_SPEC]: PM3TimePeriodSpec,
    [PM3_ALT_PEAKS_TIME_PERIOD_SPEC]: PM3AltPeaksTimePeriodSpec
  }
};
