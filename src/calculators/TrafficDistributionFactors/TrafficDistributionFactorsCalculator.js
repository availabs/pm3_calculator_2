const { ARITHMETIC, HARMONIC } = require('../../enums/meanTypes');
const { TRAVEL_TIME, SPEED } = require('../../enums/npmrdsMetrics');

const { precisionRound } = require('../../utils/MathUtils');

const createTimePeriodIdentifier = require('../timePeriods/createTimePeriodIdentifier');

const { getNpmrdsDataKey } = require('../../utils/NpmrdsDataKey');

const { FREEWAY } = require('../../enums/functionalClasses');
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

// See [FHWA PM3 Recommended Procedures](../../../documentation/FHWA_PM3_RecommendedProcedures.pdf)
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
          calcConfigParams[k] === undefined
            ? TrafficDistributionFactorsCalculator.configDefaults[k]
            : calcConfigParams[k];
      }
    );

    this.speedBased = this.npmrdsMetric === SPEED;

    const timePeriodSpecDef =
      this.timePeriodSpec === MEASURE_DEFAULT_TIME_PERIOD_SPEC
        ? defaultTimePeriodSpec
        : generalTimePeriodSpecs[this.timePeriodSpec];

    this.timePeriodIdentifier = createTimePeriodIdentifier(timePeriodSpecDef);

    this.npmrdsDataKeys = [getNpmrdsDataKey(this)];

    this.requiredTmcMetadata = ['functionalClass'];

    if (!this.speedBased) {
      this.requiredTmcMetadata.push('miles');
    }
  }

  async calculateForTmc({
    data,
    attrs: { tmc, miles: tmcMiles, functionalClass: tmcFunctionalClass }
  }) {
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

    const combinedPeakAvgTT = this.speedBased
      ? null
      : combinedPeak[1] / combinedPeak[0];

    const amPeakAvgTT = this.speedBased ? null : amPeak[1] / amPeak[0];
    const pmPeakAvgTT = this.speedBased ? null : pmPeak[1] / pmPeak[0];
    const freeFlowAvgTT = this.speedBased ? null : freeFlow[1] / freeFlow[0];

    const combinedPeakAvgSpeed = this.speedBased
      ? combinedPeak[1] / combinedPeak[0]
      : (tmcMiles / combinedPeakAvgTT) * 3600;

    const amPeakAvgSpeed = this.speedBased
      ? amPeak[1] / amPeak[0]
      : (tmcMiles / amPeakAvgTT) * 3600;

    const pmPeakAvgSpeed = this.speedBased
      ? pmPeak[1] / pmPeak[0]
      : (tmcMiles / pmPeakAvgTT) * 3600;

    const freeFlowAvgSpeed = this.speedBased
      ? freeFlow[1] / freeFlow[0]
      : (tmcMiles / freeFlowAvgTT) * 3600;

    const speedReductionFactor = combinedPeakAvgSpeed / freeFlowAvgSpeed;

    let congestionLevel;

    // see [HPMS Field Manual Dec2016 Table 3.16](../../../documentation/hpms_field_manual_dec2016.pdf)
    if (tmcFunctionalClass === FREEWAY) {
      // Freeway
      if (!speedReductionFactor || speedReductionFactor >= 0.9) {
        congestionLevel = 'NO2LOW_CONGESTION';
      } else if (speedReductionFactor >= 0.75) {
        congestionLevel = 'MODERATE_CONGESTION';
      } else {
        congestionLevel = 'SEVERE_CONGESTION';
      }

      // Not freeway
    } else if (!speedReductionFactor || speedReductionFactor >= 0.8) {
      congestionLevel = 'NO2LOW_CONGESTION';
    } else if (speedReductionFactor >= 0.65) {
      congestionLevel = 'MODERATE_CONGESTION';
    } else {
      congestionLevel = 'SEVERE_CONGESTION';
    }

    const peakSpeedDifferential = Math.abs(amPeakAvgSpeed - pmPeakAvgSpeed);

    let directionality;

    if (!peakSpeedDifferential || peakSpeedDifferential <= 6) {
      directionality = 'EVEN_DIST';
    } else {
      directionality = amPeakAvgSpeed < pmPeakAvgSpeed ? 'AM_PEAK' : 'PM_PEAK';
    }

    return this.outputFormatter({
      tmc,
      combinedPeakAvgTT: precisionRound(combinedPeakAvgTT, 3),
      amPeakAvgTT: precisionRound(amPeakAvgTT, 3),
      pmPeakAvgTT: precisionRound(pmPeakAvgTT, 3),
      freeFlowAvgTT: precisionRound(freeFlowAvgTT, 3),
      combinedPeakAvgSpeed: precisionRound(combinedPeakAvgSpeed, 3),
      amPeakAvgSpeed: precisionRound(amPeakAvgSpeed, 3),
      pmPeakAvgSpeed: precisionRound(pmPeakAvgSpeed, 3),
      freeFlowAvgSpeed: precisionRound(freeFlowAvgSpeed, 3),
      speedReductionFactor: precisionRound(speedReductionFactor, 3),
      peakSpeedDifferential: precisionRound(peakSpeedDifferential, 3),
      congestionLevel,
      directionality
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
