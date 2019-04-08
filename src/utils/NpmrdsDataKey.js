const { invert } = require('lodash');

const { ARITHMETIC, HARMONIC } = require('../enums/meanTypes');
const { TRAVEL_TIME, SPEED, DATA_DENSITY } = require('../enums/npmrdsMetrics');
const { ALL, PASS, TRUCK } = require('../enums/npmrdsDataSources');

// TODO: Handling dataDensity needs more thinking/work.
const DATA_DENSITY_AGG_PREFIX = 'max';

const meanType2KeySubstr = {
  [ARITHMETIC]: 'avg',
  [HARMONIC]: 'hmean'
};

const keySubstr2MeanType = invert(meanType2KeySubstr);
const keyMeanTypeSubstrRE = new RegExp(
  Array.prototype
    .concat(Object.keys(keySubstr2MeanType), DATA_DENSITY_AGG_PREFIX)
    .join('|')
);

const npmrdsDataSource2KeySubstr = {
  [ALL]: 'all_vehicles',
  [PASS]: 'passenger_vehicles',
  [TRUCK]: 'freight_trucks'
};

const keySubstr2NpmrdsDataSource = invert(npmrdsDataSource2KeySubstr);
const keyNpmrdsDataSourceSubstrRE = new RegExp(
  Object.keys(keySubstr2NpmrdsDataSource).join('|')
);

const npmrdsMetric2KeySubstr = {
  [TRAVEL_TIME]: 'travel_time',
  [SPEED]: 'speed',
  [DATA_DENSITY]: 'data_density'
};

const keySubstr2NpmrdsMetric = invert(npmrdsMetric2KeySubstr);
const npmrdsMetricKeySubstrRE = new RegExp(
  Object.keys(keySubstr2NpmrdsMetric).join('|')
);

const getNpmrdsTableColumn = ({ npmrdsMetric, npmrdsDataSource }) => {
  const metricSubstr = npmrdsMetric2KeySubstr[npmrdsMetric];
  const dataSourceSubstr = npmrdsDataSource2KeySubstr[npmrdsDataSource];

  return `${metricSubstr}_${dataSourceSubstr}`;
};

const getNpmrdsDataKey = ({ meanType, npmrdsMetric, npmrdsDataSource }) => {
  // TODO: How to average data_density column.
  const meanTypeSubstr =
    npmrdsMetric !== DATA_DENSITY
      ? meanType2KeySubstr[meanType]
      : DATA_DENSITY_AGG_PREFIX;
  const npmrdsTableCol = getNpmrdsTableColumn({
    npmrdsMetric,
    npmrdsDataSource
  });

  return `${meanTypeSubstr}_${npmrdsTableCol}`;
};

const parseNpmrdsDataKey = npmrdsDataKey => {
  try {
    const [meanTypeSubstr] = npmrdsDataKey.match(keyMeanTypeSubstrRE);
    const [npmrdsDataSourceSubtr] = npmrdsDataKey.match(
      keyNpmrdsDataSourceSubstrRE
    );
    const [npmrdsMetricSubtr] = npmrdsDataKey.match(npmrdsMetricKeySubstrRE);

    // No meanType for dataDensity
    const meanType = keySubstr2MeanType[meanTypeSubstr] || null;
    const npmrdsDataSource = keySubstr2NpmrdsDataSource[npmrdsDataSourceSubtr];
    const npmrdsMetric = keySubstr2NpmrdsMetric[npmrdsMetricSubtr];

    return {
      meanType,
      npmrdsDataSource,
      npmrdsMetric
    };
  } catch (err) {
    throw new Error(
      `ERROR: could not parse the following "npmrdsDataKey": ${npmrdsDataKey}`
    );
  }
};

module.exports = { getNpmrdsTableColumn, getNpmrdsDataKey, parseNpmrdsDataKey };
