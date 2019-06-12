const assert = require('assert');

const { isEqual, omit } = require('lodash');
const { quantileSorted } = require('simple-statistics');

const { numbersComparator } = require('../../utils/MathUtils');

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
  PTI_TIME_PERIOD_SPEC
} = timePeriodSpecNamesEnum;

const defaultTimePeriodSpec =
  generalTimePeriodSpecs[PTI_TIME_PERIOD_SPEC]

const outputFormatters = require('./PlanningTimeIndexOutputFormatters');

const PTI = 'PTI';
const NINETYFIFTH_PCTL = 0.95;
const FIFTH_PCTL = 0.05;

function isCanonicalConfig(configDefaults) {
  return (
    this.timeBinSize === 15 &&
    Object.keys(configDefaults).every(k => isEqual(this[k], configDefaults[k]))
  );
}

class PlanningTimeIndexCalculator {
  constructor(calcConfigParams) {
    const { configDefaults } = PlanningTimeIndexCalculator;

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

    const crossTimePeriodMetricValues = [];
    const metricValuesByTimePeriod = data.reduce((acc, row) => {
      assert.strictEqual(row.tmc, attrs.tmc);

      const { [npmrdsDataKey]: metricValue } = row;

      const timePeriod = this.timePeriodIdentifier(row);

      // if (timePeriod && metricValue !== null) {
      if (timePeriod && metricValue !== null) {
        crossTimePeriodMetricValues.push(metricValue);

        acc[timePeriod] = acc[timePeriod] || [];
        acc[timePeriod].push(metricValue);
      }

      return acc;
    }, {});

    const crossTimePeriodPctlMetricValue = crossTimePeriodMetricValues.length
      ? quantileSorted(
          crossTimePeriodMetricValues.sort(numbersComparator),
          isSpeedBased ? FIFTH_PCTL : NINETYFIFTH_PCTL
        )
      : null;

    const pctlMetricValueByTimePeriod = Object.keys(
      metricValuesByTimePeriod
    ).reduce((acc, timePeriod) => {
      const metricValues = metricValuesByTimePeriod[timePeriod].sort(
        numbersComparator
      );

      acc[timePeriod] = quantileSorted(
        metricValues,
        isSpeedBased ? FIFTH_PCTL : NINETYFIFTH_PCTL
      );

      return acc;
    }, {});

    const ninetyfifthPctlTravelTimeByTimePeriod = isSpeedBased
      ? null
      : pctlMetricValueByTimePeriod;

    const fifthPctlSpeedByTimePeriod = isSpeedBased
      ? pctlMetricValueByTimePeriod
      : null;

    const pti =
      pctlMetricValueByTimePeriod !== null // eslint-disable-line no-nested-ternary
        ? isSpeedBased
          ? precisionRound(freeflowSpeed / crossTimePeriodPctlMetricValue, 4)
          : precisionRound(crossTimePeriodPctlMetricValue / freeflowTravelTime, 4)
        : null;

    const ptiByTimePeriod = Object.keys(pctlMetricValueByTimePeriod).reduce(
      (acc, timePeriod) => {
        const v = isSpeedBased
          ? freeflowSpeed / fifthPctlSpeedByTimePeriod[timePeriod]
          : ninetyfifthPctlTravelTimeByTimePeriod[timePeriod] /
            freeflowTravelTime;

        acc[timePeriod] = precisionRound(v, 4);

        return acc;
      },
      {}
    );

    const result = Object.assign(
      {
        tmc,
        npmrdsDataKey,
        pti,
        ptiByTimePeriod: omit(ptiByTimePeriod, '_*_')
      },
      isSpeedBased
        ? { fifthPctlSpeedByTimePeriod, freeflowSpeed }
        : { ninetyfifthPctlTravelTimeByTimePeriod, freeflowTravelTime }
    );

    return this.outputFormatter(result);
  }
}

PlanningTimeIndexCalculator.measure = PTI;
PlanningTimeIndexCalculator.configDefaults = {
  meanType: ARITHMETIC,
  npmrdsDataSource: ALL,
  npmrdsMetric: TRAVEL_TIME,
  timePeriodSpec: MEASURE_DEFAULT_TIME_PERIOD_SPEC,
  roundPlanningTimes: false
};
PlanningTimeIndexCalculator.configOptions = {
  meanType: [ARITHMETIC, HARMONIC],
  npmrdsDataSource: npmrdsDataSources,
  npmrdsMetric: [TRAVEL_TIME, SPEED],
  timePeriodSpec: timePeriodSpecNames,
};
PlanningTimeIndexCalculator.defaultTimePeriodSpec = defaultTimePeriodSpec;

module.exports = PlanningTimeIndexCalculator;
