const assert = require('assert');

const { isEqual, omit } = require('lodash');

const FreeflowCalculator = require('../Freeflow/FreeflowCalculator');

const { ARITHMETIC, HARMONIC } = require('../../enums/meanTypes');
const { TRAVEL_TIME, SPEED } = require('../../enums/npmrdsMetrics');
const { IDENTITY } = require('../../enums/outputFormats');

const { precisionRound } = require('../../utils/MathUtils');

const createTimePeriodIdentifier = require('../timePeriods/createTimePeriodIdentifier');

const { getNpmrdsDataKey } = require('../../utils/NpmrdsDataKey');

const npmrdsDataSourcesEnum = require('../../enums/npmrdsDataSources');

const npmrdsDataSources = Object.keys(npmrdsDataSourcesEnum);
const { ALL } = npmrdsDataSourcesEnum;

const {
  names: timePeriodSpecNamesEnum,
  specs: generalTimePeriodSpecs
} = require('../timePeriods/TimePeriodSpecs');

const timePeriodSpecNames = Object.keys(timePeriodSpecNamesEnum);

const {
  MEASURE_DEFAULT_TIME_PERIOD_SPEC,
  TTI_TIME_PERIOD_SPEC
} = timePeriodSpecNamesEnum;

const defaultTimePeriodSpec =
  generalTimePeriodSpecs[TTI_TIME_PERIOD_SPEC];

const outputFormatters = require('./TravelTimeIndexOutputFormatters');

const TTI = 'TTI';

function isCanonicalConfig(configDefaults) {
  return (
    this.timeBinSize === 15 &&
    Object.keys(configDefaults).every(k => isEqual(this[k], configDefaults[k]))
  );
}

class TravelTimeIndexCalculator {
  constructor(calcConfigParams) {
    const { configDefaults } = TravelTimeIndexCalculator;

    this.year = calcConfigParams.year;
    this.meanType = calcConfigParams.meanType;
    this.timeBinSize = calcConfigParams.timeBinSize;

    this.outputFormatter = outputFormatters[calcConfigParams.outputFormat].bind(
      this
    );

    Object.keys(configDefaults).forEach(k => {
      this[k] =
        calcConfigParams[k] === undefined
          ? configDefaults[k]
          : calcConfigParams[k];
    });

    const timePeriodSpecDef =
      this.timePeriodSpec === MEASURE_DEFAULT_TIME_PERIOD_SPEC
        ? defaultTimePeriodSpec
        : generalTimePeriodSpecs[this.timePeriodSpec];

    const freeflowCalculator = new FreeflowCalculator(
      Object.assign({}, calcConfigParams, { outputFormat: IDENTITY })
    );

    this.requiredTmcMetadata = freeflowCalculator.requiredTmcMetadata;
    this.calculateFreeflow = freeflowCalculator.calculateForTmc.bind(freeflowCalculator)

    this.timePeriodIdentifier = createTimePeriodIdentifier(timePeriodSpecDef);

    this.npmrdsDataKeys = [getNpmrdsDataKey(this)];

    this.isSpeedBased = this.npmrdsMetric === SPEED;

    this.isCanonical = isCanonicalConfig.call(this, configDefaults);
  }

  async calculateForTmc({ data, attrs }) {
    const { tmc } = attrs;
    const {
      isSpeedBased,
      npmrdsDataKeys: [npmrdsDataKey]
    } = this;

    const {
      eightyFifthPctlSpeed: freeflowSpeed,
      fifteenthPctlTravelTime: freeflowTravelTime
    } = await this.calculateFreeflow({ data, attrs });

    const avgComponentsByTimePeriod = data.reduce(
      (acc, row) => {
        assert.strictEqual(row.tmc, attrs.tmc);

        const { [npmrdsDataKey]: metricValue } = row;

        const timePeriod = this.timePeriodIdentifier(row);

        // if (timePeriod && metricValue !== null) {
        if (timePeriod && metricValue !== null) {
          acc['_*_'].sum += +metricValue;
          ++acc['_*_'].ct;

          acc[timePeriod] = acc[timePeriod] || { sum: 0, ct: 0 };
          acc[timePeriod].sum += +metricValue;
          ++acc[timePeriod].ct;
        }

        return acc;
      },
      { '_*_': { sum: 0, ct: 0 } }
    );

    const avgMetricValueByTimePeriod = Object.keys(
      avgComponentsByTimePeriod
    ).reduce((acc, timePeriod) => {
      const { sum, ct } = avgComponentsByTimePeriod[timePeriod];
      acc[timePeriod] = ct ? sum / ct : null;
      return acc;
    }, {});

    const avgTravelTimeByTimePeriod = isSpeedBased
      ? null
      : avgMetricValueByTimePeriod;

    const avgSpeedByTimePeriod = isSpeedBased
      ? avgMetricValueByTimePeriod
      : null;

    const ttiByTimePeriod = Object.keys(avgMetricValueByTimePeriod).reduce(
      (acc, timePeriod) => {
        const tti = isSpeedBased
          ? freeflowSpeed / avgSpeedByTimePeriod[timePeriod]
          : avgTravelTimeByTimePeriod[timePeriod] / freeflowTravelTime;

        acc[timePeriod] = precisionRound(tti, 4);

        return acc;
      },
      {}
    );

    const result = Object.assign(
      {
        tmc,
        npmrdsDataKey,
        tti: ttiByTimePeriod['_*_'],
        ttiByTimePeriod: omit(ttiByTimePeriod, '_*_')
      },
      isSpeedBased
        ? { avgSpeedByTimePeriod, freeflowSpeed }
        : { avgTravelTimeByTimePeriod, freeflowTravelTime }
    );

    return this.outputFormatter(result);
  }
}

TravelTimeIndexCalculator.measure = TTI;
TravelTimeIndexCalculator.configDefaults = {
  meanType: ARITHMETIC,
  npmrdsDataSource: ALL,
  npmrdsMetric: TRAVEL_TIME,
  timePeriodSpec: MEASURE_DEFAULT_TIME_PERIOD_SPEC,
  roundTravelTimes: false
};
TravelTimeIndexCalculator.configOptions = {
  meanType: [ARITHMETIC, HARMONIC],
  npmrdsDataSource: npmrdsDataSources,
  npmrdsMetric: [TRAVEL_TIME, SPEED],
  timePeriodSpec: timePeriodSpecNames,
};
TravelTimeIndexCalculator.defaultTimePeriodSpec = defaultTimePeriodSpec;

module.exports = TravelTimeIndexCalculator;
