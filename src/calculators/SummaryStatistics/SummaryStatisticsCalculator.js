const npmrdsDataSourcesEnum = require('../../enums/npmrdsDataSources');

const npmrdsDataSources = Object.keys(npmrdsDataSourcesEnum);
const { ALL } = npmrdsDataSourcesEnum;

const { ARITHMETIC, HARMONIC } = require('../../enums/meanTypes');
const { TRAVEL_TIME, SPEED } = require('../../enums/npmrdsMetrics');

const {
  precisionRound,
  computeSummaryStats
} = require('../../utils/MathUtils');

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

const outputFormatters = require('./SummaryStatisticsOutputFormatters');

const SUMMARY_STATISTICS = 'SUMMARY_STATISTICS';

class SummaryStatisticsCalculator {
  constructor(calcConfigParams) {
    this.year = calcConfigParams.year;
    this.meanType = calcConfigParams.meanType;
    this.timeBinSize = calcConfigParams.timeBinSize;

    this.outputFormatter = outputFormatters[calcConfigParams.outputFormat].bind(
      this
    );

    Object.keys(SummaryStatisticsCalculator.configDefaults).forEach(k => {
      this[k] =
        calcConfigParams[k] || SummaryStatisticsCalculator.configDefaults[k];
    });

    const timePeriodSpec =
      this.timePeriodSpec === MEASURE_DEFAULT_TIME_PERIOD_SPEC
        ? defaultTimePeriodSpec
        : generalTimePeriodSpecs[this.timePeriodSpec];

    this.timePeriodIdentifier = createTimePeriodIdentifier(timePeriodSpec);

    this.npmrdsDataKeys = [getNpmrdsDataKey(this)];
  }

  async calculateForTmc({ data, attrs: { tmc } }) {
    const {
      npmrdsDataKeys: [npmrdsDataKey]
    } = this;

    const metricValuesByTimePeriod = data.reduce((acc, row) => {
      const { [npmrdsDataKey]: metricValue } = row;

      const timePeriod = this.timePeriodIdentifier(row);

      if (timePeriod && metricValue !== null) {
        acc[timePeriod] = acc[timePeriod] || [];
        acc[timePeriod].push(metricValue);
      }

      return acc;
    }, {});

    const summaryStatsByTimePeriod = Object.keys(
      metricValuesByTimePeriod
    ).reduce((acc, timePeriod) => {
      const stats = computeSummaryStats(metricValuesByTimePeriod[timePeriod]);

      acc[timePeriod] = Object.keys(stats).reduce((acc2, stat) => {
        // eslint-disable-next-line no-param-reassign
        acc2[stat] = precisionRound(stats[stat], 4);
        return acc2;
      }, {});

      return acc;
    }, {});

    return this.outputFormatter({
      tmc,
      summaryStatsByTimePeriod
    });
  }
}

SummaryStatisticsCalculator.measure = SUMMARY_STATISTICS;
SummaryStatisticsCalculator.configDefaults = {
  meanType: ARITHMETIC,
  npmrdsDataSource: ALL,
  npmrdsMetric: TRAVEL_TIME,
  timePeriodSpec: MEASURE_DEFAULT_TIME_PERIOD_SPEC
};
SummaryStatisticsCalculator.configOptions = {
  meanType: [ARITHMETIC, HARMONIC],
  npmrdsDataSource: npmrdsDataSources,
  npmrdsMetric: [TRAVEL_TIME, SPEED],
  timePeriodSpec: timePeriodSpecNames
};

SummaryStatisticsCalculator.defaultTimePeriodSpec = defaultTimePeriodSpec;

module.exports = SummaryStatisticsCalculator;
