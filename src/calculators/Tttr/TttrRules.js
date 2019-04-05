/*
	From FinalRule:
		The TTTR metric shall be reported to HPMS for each reporting segment (to
		the nearest hundredths) for each of the five time periods identified in
		paragraphs (a)(1)(i) through (v) of this section; the corresponding 95th
		percentile travel times (to the nearest second) and the corresponding normal
		(50th percentile) travel times (to the nearest second).

	From Travel Time Metric Data Reporting Requirements & Specifications
		Truck travel time reliability (TTTR) metric for a reporting segment for “AM Peak.” “AM Peak” is between
		the hours of 6:00 a.m. and 10:00 a.m. for every weekday (Monday through Friday) from January 1st
		through December 31st of the same calendar year, as described in 23 CFR 490.611(a)(1)(i). As described
		in 23 CFR 490.611(a)(3), the reported value for AM Peak Truck Travel Time Reliability (TTTR_AMP) for a
		reporting segment the AM Peak 95th Percentile Truck Travel Time (TTT_AMP95PCT) for that reporting
		segment divided by the AM Peak 50th Percentile Truck Travel Time (TTT_AMP50PCT) for that reporting
		segment and rounded to the nearest hundredth. For computing TTTR_AMP metric, the travel time
		values TTT_AMP50PCT and TTT_AMP95PCT should not be rounded. However, reported
		TTT_AMP50PCT and TTT_AMP95PCT values must be in units of seconds rounded to the nearest integer,
		as required in 23 CFR 490.611(b)(2).
*/

const npmrdsDataSources = require('../../enums/npmrdsDataSources');

const { TRAVEL_TIME, SPEED } = require('../../enums/npmrdsMetrics');

const TTTR = 'TTTR';

const {
  names: timePeriodSpecNames,
  specs: generalTimePeriodSpecs
} = require('../timePeriods/TimePeriodSpecs');

const {
  MEASURE_DEFAULT_TIME_PERIOD_SPEC,
  PM3_TIME_PERIOD_SPEC
} = timePeriodSpecNames;

const defaultTimePeriodSpec = generalTimePeriodSpecs[PM3_TIME_PERIOD_SPEC]

module.exports = {
  measure: TTTR,
  configDefaults: {
    npmrdsDataSources: [npmrdsDataSources.TRUCK],
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
