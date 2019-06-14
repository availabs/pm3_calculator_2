const assert = require('assert');

const { isEqual } = require('lodash');

const npmrdsDataSourcesEnum = require('../../enums/npmrdsDataSources');

const npmrdsDataSources = Object.keys(npmrdsDataSourcesEnum);
const { ALL } = npmrdsDataSourcesEnum;

const { ARITHMETIC, HARMONIC } = require('../../enums/meanTypes');
const { TRAVEL_TIME, SPEED } = require('../../enums/npmrdsMetrics');

const { precisionRound } = require('../../utils/MathUtils');

const {
  getNumBinsForYear,
  getNumBinsPerTimePeriodForYear
} = require('../../utils/TimeUtils');

const createTimePeriodIdentifier = require('../timePeriods/createTimePeriodIdentifier');

const { getNpmrdsDataKey } = require('../../utils/NpmrdsDataKey');

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

const outputFormatters = require('./PercentBinsReportingOutputFormatters');

const PERCENT_BINS_REPORTING = 'PERCENT_BINS_REPORTING';

function isCanonicalConfig(configDefaults) {
  return (
    this.timeBinSize === 15 &&
    Object.keys(configDefaults).every(k => isEqual(this[k], configDefaults[k]))
  );
}

class PercentBinsReportingCalculator {
  constructor(calcConfigParams) {
    const { configDefaults } = PercentBinsReportingCalculator;

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

    const timePeriodSpec =
      this.timePeriodSpec === MEASURE_DEFAULT_TIME_PERIOD_SPEC
        ? defaultTimePeriodSpec
        : generalTimePeriodSpecs[this.timePeriodSpec];

    this.timePeriodIdentifier = createTimePeriodIdentifier(timePeriodSpec);

    this.numBinsForYear = getNumBinsForYear(this);
    this.numBinsPerTimePeriodForYear = getNumBinsPerTimePeriodForYear(this);

    this.npmrdsDataKeys = [getNpmrdsDataKey(this)];

    this.isCanonical = isCanonicalConfig.call(this, configDefaults);
  }

  async calculateForTmc({ data, attrs }) {
    const { tmc } = attrs;

    const {
      numBinsForYear,
      npmrdsDataKeys: [npmrdsDataKey]
    } = this;

    let totalCount = 0;

    const countsByTimePeriod = data.reduce((acc, row) => {
      assert.strictEqual(row.tmc, attrs.tmc);

      const { [npmrdsDataKey]: metricValue } = row;

      if (metricValue !== null) {
        ++totalCount;
      } else {
        return acc;
      }

      const timePeriod = this.timePeriodIdentifier(row);

      if (timePeriod) {
        acc[timePeriod] = acc[timePeriod] || 0;
        ++acc[timePeriod];
      }

      return acc;
    }, {});

    const totalPercentBinsReporting = precisionRound(totalCount / numBinsForYear, 3);

    const percentBinsReportingByTimePeriod = Object.keys(
      this.numBinsPerTimePeriodForYear
    ).reduce((acc, timePeriod) => {
      acc[timePeriod] = precisionRound(
        countsByTimePeriod[timePeriod] /
          this.numBinsPerTimePeriodForYear[timePeriod],
        3
      );
      return acc;
    }, {});

    return this.outputFormatter({
      tmc,
      totalPercentBinsReporting,
      percentBinsReportingByTimePeriod
    });
  }
}

PercentBinsReportingCalculator.measure = PERCENT_BINS_REPORTING;
PercentBinsReportingCalculator.configDefaults = {
  meanType: ARITHMETIC,
  npmrdsDataSource: ALL,
  npmrdsMetric: TRAVEL_TIME,
  timePeriodSpec: MEASURE_DEFAULT_TIME_PERIOD_SPEC
};
PercentBinsReportingCalculator.configOptions = {
  meanType: [ARITHMETIC, HARMONIC],
  npmrdsDataSource: npmrdsDataSources,
  npmrdsMetric: [TRAVEL_TIME, SPEED],
  timePeriodSpec: timePeriodSpecNames
};
PercentBinsReportingCalculator.defaultTimePeriodSpec = defaultTimePeriodSpec;

module.exports = PercentBinsReportingCalculator;
