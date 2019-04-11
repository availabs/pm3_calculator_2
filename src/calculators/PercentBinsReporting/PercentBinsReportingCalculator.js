const npmrdsDataSourcesEnum = require('../../enums/npmrdsDataSources');

const npmrdsDataSources = Object.keys(npmrdsDataSourcesEnum);
const { ALL } = npmrdsDataSourcesEnum;

const { ARITHMETIC, HARMONIC } = require('../../enums/meanTypes');
const { TRAVEL_TIME, SPEED } = require('../../enums/npmrdsMetrics');

const { precisionRound } = require('../../utils/MathUtils');

const { getNumBinsPerTimePeriodForYear } = require('../../utils/TimeUtils');

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

class PercentBinsReportingCalculator {
  constructor(calcConfigParams) {
    this.year = calcConfigParams.year;
    this.meanType = calcConfigParams.meanType;
    this.timeBinSize = calcConfigParams.timeBinSize;

    this.outputFormatter = outputFormatters[calcConfigParams.outputFormat].bind(
      this
    );

    Object.keys(PercentBinsReportingCalculator.configDefaults).forEach(k => {
      this[k] =
        calcConfigParams[k] || PercentBinsReportingCalculator.configDefaults[k];
    });

    const timePeriodSpec =
      this.timePeriodSpec === MEASURE_DEFAULT_TIME_PERIOD_SPEC
        ? defaultTimePeriodSpec
        : generalTimePeriodSpecs[this.timePeriodSpec];

    this.timePeriodIdentifier = createTimePeriodIdentifier(timePeriodSpec);

    this.numBinsPerTimePeriodForYear = getNumBinsPerTimePeriodForYear(this);

    this.npmrdsDataKeys = [getNpmrdsDataKey(this)];
  }

  async calculateForTmc({ data, attrs: { tmc } }) {
    const {
      npmrdsDataKeys: [npmrdsDataKey]
    } = this;

    const countsByTimePeriod = data.reduce((acc, row) => {
      const { [npmrdsDataKey]: metricValue } = row;
      const timePeriod = this.timePeriodIdentifier(row);

      // console.error('==>', typeof timePeriod);
      if (timePeriod && metricValue !== null) {
        acc[timePeriod] = acc[timePeriod] || 0;
        ++acc[timePeriod];
      }

      return acc;
    }, {});

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

    return this.outputFormatter({ tmc, percentBinsReportingByTimePeriod });
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
