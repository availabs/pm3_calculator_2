const npmrdsDataSources = Object.keys(require('../../enums/npmrdsDataSources'));

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

const PERCENT_BINS_REPORTING = 'PERCENT_BINS_REPORTING';

class PercentBinsReportingCalculator {
  constructor(calcConfigParams) {
    this.year = calcConfigParams.year;
    this.meanType = calcConfigParams.meanType;
    this.timeBinSize = calcConfigParams.timeBinSize;

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

    this.requiredTmcAttributes =
      this.npmrdsMetric === SPEED ? ['length'] : null;
  }

  async calculateForTmc({ data, attrs: { tmc } }) {
    const {
      npmrdsDataKeys: [npmrdsDataKey]
    } = this;

    const countsByTimePeriod = data.reduce((acc, row) => {
      const { [npmrdsDataKey]: metric_value } = row;
      const timePeriod = this.timePeriodIdentifier(row);

      // console.error('==>', typeof timePeriod);
      if (timePeriod && metric_value !== null) {
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

    return { tmc, percentBinsReportingByTimePeriod };
  }
}

PercentBinsReportingCalculator.measure = PERCENT_BINS_REPORTING;
PercentBinsReportingCalculator.configDefaults = {
  npmrdsDataSource: [npmrdsDataSources.ALL],
  npmrdsMetric: TRAVEL_TIME,
  timePeriodSpec: MEASURE_DEFAULT_TIME_PERIOD_SPEC
};
PercentBinsReportingCalculator.configOptions = {
  npmrdsDataSource: npmrdsDataSources,
  npmrdsMetric: [TRAVEL_TIME, SPEED],
  timePeriodSpec: timePeriodSpecNames
};
PercentBinsReportingCalculator.defaultTimePeriodSpec = defaultTimePeriodSpec;

module.exports = PercentBinsReportingCalculator;
