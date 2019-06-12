const MEASURE_DEFAULT_TIME_PERIOD_SPEC = 'MEASURE_DEFAULT_TIME_PERIOD_SPEC';
const PM3_TIME_PERIOD_SPEC = 'PM3_TIME_PERIOD_SPEC';
const PM3_ALT_PEAKS_TIME_PERIOD_SPEC = 'PM3_ALT_PEAKS_TIME_PERIOD_SPEC';
const TRAFFIC_DISTRIBUTION_FACTORS_TIME_PERIOD_SPEC =
  'TRAFFIC_DISTRIBUTION_FACTORS_TIME_PERIOD_SPEC';
const TRAFFIC_DISTRIBUTION_FACTORS_ALT_PEAKS_TIME_PERIOD_SPEC =
  'TRAFFIC_DISTRIBUTION_FACTORS_ALT_PEAKS_TIME_PERIOD_SPEC';
const TOTAL_TIME_PERIOD_SPEC = 'TOTAL_TIME_PERIOD_SPEC';
const FREEFLOW_TIME_PERIOD_SPEC = 'FREEFLOW_TIME_PERIOD_SPEC';
const PTI_TIME_PERIOD_SPEC =
  'PTI_TIME_PERIOD_SPEC';
const TTI_TIME_PERIOD_SPEC = 'TTI_TIME_PERIOD_SPEC';

const PM3TimePeriodSpec = require('./PM3TimePeriodSpec');
const PM3AltPeaksTimePeriodSpec = require('./PM3AltPeaksTimePeriodSpec');
const TrafficDistributionFactorsTimePeriodSpec = require('./TrafficDistributionFactorsTimePeriodSpec');
const TrafficDistributionFactorsAltPeaksTimePeriodSpec = require('./TrafficDistributionFactorsAltPeaksTimePeriodSpec');
const TotalTimePeriodSpec = require('./TotalTimePeriodSpec');
const FreeflowTimePeriodSpec = require('./FreeflowTimePeriodSpec');
const PTITimePeriodSpec = require('./PTITimePeriodSpec');
const TTITimePeriodSpec = require('./TTITimePeriodSpec');

module.exports = {
  names: {
    MEASURE_DEFAULT_TIME_PERIOD_SPEC,
    PM3_TIME_PERIOD_SPEC,
    PM3_ALT_PEAKS_TIME_PERIOD_SPEC,
    TRAFFIC_DISTRIBUTION_FACTORS_TIME_PERIOD_SPEC,
    TRAFFIC_DISTRIBUTION_FACTORS_ALT_PEAKS_TIME_PERIOD_SPEC,
    TOTAL_TIME_PERIOD_SPEC,
    FREEFLOW_TIME_PERIOD_SPEC,
    PTI_TIME_PERIOD_SPEC,
    TTI_TIME_PERIOD_SPEC
  },
  specs: {
    [PM3_TIME_PERIOD_SPEC]: PM3TimePeriodSpec,
    [PM3_ALT_PEAKS_TIME_PERIOD_SPEC]: PM3AltPeaksTimePeriodSpec,
    [TRAFFIC_DISTRIBUTION_FACTORS_TIME_PERIOD_SPEC]: TrafficDistributionFactorsTimePeriodSpec,
    [TRAFFIC_DISTRIBUTION_FACTORS_ALT_PEAKS_TIME_PERIOD_SPEC]: TrafficDistributionFactorsAltPeaksTimePeriodSpec,
    [TOTAL_TIME_PERIOD_SPEC]: TotalTimePeriodSpec,
    [FREEFLOW_TIME_PERIOD_SPEC]: FreeflowTimePeriodSpec,
    [PTI_TIME_PERIOD_SPEC]: PTITimePeriodSpec,
    [TTI_TIME_PERIOD_SPEC]: TTITimePeriodSpec
  }
};
