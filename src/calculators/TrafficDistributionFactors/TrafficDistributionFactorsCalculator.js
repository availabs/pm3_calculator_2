const { ARITHMETIC, HARMONIC } = require('../../enums/meanTypes');
const { TRAVEL_TIME, SPEED } = require('../../enums/npmrdsMetrics');

const { precisionRound } = require('../../utils/MathUtils');

const createTimePeriodIdentifier = require('../timePeriods/createTimePeriodIdentifier');

const { getNpmrdsDataKey } = require('../../utils/NpmrdsDataKey');

const npmrdsDataSourcesEnum = require('../../enums/npmrdsDataSources');

const npmrdsDataSources = Object.keys(npmrdsDataSourcesEnum);
const { ALL } = npmrdsDataSourcesEnum;

const { AMP, PMP } = require('../../enums/pm3TimePeriods');
const { FREEFLOW } = require('../../enums/altTimePeriods');

const {
  names: timePeriodSpecNamesEnum,
  specs: generalTimePeriodSpecs
} = require('../timePeriods/TimePeriodSpecs');

const timePeriodSpecNames = Object.keys(timePeriodSpecNamesEnum);

const {
  MEASURE_DEFAULT_TIME_PERIOD_SPEC,
  TRAFFIC_DISTRIBUTION_FACTORS_TIME_PERIOD_SPEC
} = timePeriodSpecNamesEnum;

const defaultTimePeriodSpec =
  generalTimePeriodSpecs[TRAFFIC_DISTRIBUTION_FACTORS_TIME_PERIOD_SPEC];

const outputFormatters = require('./TrafficDistributionFactorsOutputFormatters');

const TRAFFIC_DISTRIBUTION_FACTORS = 'TRAFFIC_DISTRIBUTION_FACTORS';

class TrafficDistributionFactorsCalculator {
  constructor(calcConfigParams) {
    this.year = calcConfigParams.year;
    this.meanType = calcConfigParams.meanType;
    this.timeBinSize = calcConfigParams.timeBinSize;

    this.outputFormatter = outputFormatters[calcConfigParams.outputFormat].bind(
      this
    );

    Object.keys(TrafficDistributionFactorsCalculator.configDefaults).forEach(
      k => {
        this[k] =
          calcConfigParams[k] ||
          TrafficDistributionFactorsCalculator.configDefaults[k];
      }
    );

    const timePeriodSpecDef =
      this.timePeriodSpec === MEASURE_DEFAULT_TIME_PERIOD_SPEC
        ? defaultTimePeriodSpec
        : generalTimePeriodSpecs[this.timePeriodSpec];

    this.timePeriodIdentifier = createTimePeriodIdentifier(timePeriodSpecDef);

    this.npmrdsDataKeys = [getNpmrdsDataKey(this)];
  }

  async calculateForTmc({ data, attrs: { tmc } }) {
    const {
      npmrdsDataKeys: [npmrdsDataKey]
    } = this;

    const combinedPeak = [0, 0];
    const amPeak = [0, 0];
    const pmPeak = [0, 0];
    const freeFlow = [0, 0];

    for (let i = 0; i < data.length; ++i) {
      const row = data[i];

      const { [npmrdsDataKey]: metricValue } = row;

      const timePeriod = this.timePeriodIdentifier(row);

      if (timePeriod && metricValue !== null) {
        if (timePeriod === AMP) {
          ++combinedPeak[0];
          combinedPeak[1] += +metricValue;

          ++amPeak[0];
          amPeak[1] += +metricValue;
        } else if (timePeriod === PMP) {
          ++combinedPeak[0];
          combinedPeak[1] += +metricValue;

          ++pmPeak[0];
          pmPeak[1] += +metricValue;
        } else if (timePeriod === FREEFLOW) {
          freeFlow[0] += 1;
          freeFlow[1] += +metricValue;
        }
      }
    }

    const metricSuffix = this.npmrdsMetric === SPEED ? 'Speed' : 'TT';

    const trafficDistributionFactors = {
      [`combinedPeakAvg${metricSuffix}`]: precisionRound(
        combinedPeak[1] / combinedPeak[0],
        3
      ),
      [`amPeakAvg${metricSuffix}`]: precisionRound(amPeak[1] / amPeak[0], 3),
      [`pmPeakAvg${metricSuffix}`]: precisionRound(pmPeak[1] / pmPeak[0], 3),
      [`freeFlowAvg${metricSuffix}`]: precisionRound(
        freeFlow[1] / freeFlow[0],
        3
      )
    };

    return this.outputFormatter({
      tmc,
      npmrdsDataKey: this.npmrdsDataKeys[0],
      amPeak,
      pmPeak,
      freeFlow,
      trafficDistributionFactors
    });
  }
}

TrafficDistributionFactorsCalculator.measure = TRAFFIC_DISTRIBUTION_FACTORS;
TrafficDistributionFactorsCalculator.configDefaults = {
  meanType: ARITHMETIC,
  npmrdsDataSource: ALL,
  npmrdsMetric: TRAVEL_TIME,
  timePeriodSpec: MEASURE_DEFAULT_TIME_PERIOD_SPEC
};
TrafficDistributionFactorsCalculator.configOptions = {
  meanType: [ARITHMETIC, HARMONIC],
  npmrdsDataSource: npmrdsDataSources,
  npmrdsMetric: [TRAVEL_TIME, SPEED],
  timePeriodSpec: timePeriodSpecNames
};
TrafficDistributionFactorsCalculator.defaultTimePeriodSpec = defaultTimePeriodSpec;

module.exports = TrafficDistributionFactorsCalculator;
