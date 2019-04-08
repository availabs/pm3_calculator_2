const { query } = require('../services/DBService');
const { cartesianProduct, uniq } = require('../../utils/SetUtils');

const {
  TRAVEL_TIME,
  SPEED,
  DATA_DENSITY
} = require('../../enums/npmrdsMetrics');
const { ARITHMETIC, HARMONIC } = require('../../enums/meanTypes');

const {
  getNpmrdsTableColumn,
  getNpmrdsDataKey,
  parseNpmrdsDataKey
} = require('../../utils/NpmrdsDataKey');

const meanTypes = Object.keys(require('../../enums/meanTypes.js'));
const npmrdsDataSources = Object.keys(require('../../enums/npmrdsDataSources'));
const npmrdsMetrics = Object.keys(require('../../enums/npmrdsMetrics'));

const MINUTES_PER_EPOCH = 5;

const metricKeyParamCombos = cartesianProduct(
  meanTypes.map(meanType => ({ meanType })),
  npmrdsDataSources.map(npmrdsDataSource => ({ npmrdsDataSource })),
  npmrdsMetrics.map(npmrdsMetric => ({ npmrdsMetric }))
).map(triplet => Object.assign({}, ...triplet));

const npmrdsDataKey2SqlTable = metricKeyParamCombos.reduce((acc, params) => {
  const { meanType, npmrdsDataSource, npmrdsMetric } = params;
  const npmrdsDataKey = getNpmrdsDataKey(params);

  if (acc[npmrdsDataKey]) {
    return acc;
  }

  if (npmrdsMetric === TRAVEL_TIME || npmrdsMetric === SPEED) {
    const npmrdsTableCol = getNpmrdsTableColumn({
      npmrdsDataSource,
      npmrdsMetric: TRAVEL_TIME
    });

    const v =
      npmrdsMetric === TRAVEL_TIME
        ? npmrdsTableCol
        : `(attr.miles / ${npmrdsTableCol} * 3600)`;

    if (meanType === ARITHMETIC) {
      acc[npmrdsDataKey] = `
        AVG(${v}) AS ${npmrdsDataKey}`;
    } else if (meanType === HARMONIC) {
      acc[npmrdsDataKey] = `
        (
          COUNT(${npmrdsTableCol})::DOUBLE PRECISION
          /
          SUM(
            1::DOUBLE PRECISION
            /
            ${v}::DOUBLE PRECISION
          )
        ) AS ${npmrdsDataKey}`;
    }
  } else if (npmrdsMetric === DATA_DENSITY) {
    const npmrdsTableCol = getNpmrdsTableColumn(params);
    acc[npmrdsDataKey] = `MAX(${npmrdsTableCol}) AS ${npmrdsDataKey}`;
  }

  return acc;
}, {});

const getBinnedYearNpmrdsDataForTmc = async ({
  year,
  timeBinSize,
  tmc,
  state,
  npmrdsDataKeys
}) => {
  if (!Array.isArray(npmrdsDataSources)) {
    throw new Error('ERROR: npmrdsDataSources params is required');
  }
  const yr = +year;

  const startDate = `01/01/${yr}`;
  const endDate = `01/01/${+yr + 1}`;

  const schema = `"${state || 'public'}"`;

  const cols = uniq(npmrdsDataKeys)
    .sort()
    .map(npmrdsDataKey => npmrdsDataKey2SqlTable[npmrdsDataKey]);

  const requiresTmcLength = npmrdsDataKeys.some(
    npmrdsDataKey => parseNpmrdsDataKey(npmrdsDataKey).npmrdsMetric === SPEED
  );

  cols.forEach((c, i) => {
    if (!c) {
      throw new Error(`ERROR: unrecognized npmrdsDataKey ${npmrdsDataKeys[i]}`);
    }
  });

  const epochsPerBin = Math.floor(timeBinSize / MINUTES_PER_EPOCH);

  const sql = `
    SELECT
        to_char(date, 'YYYY-MM-DD') AS date,
        FLOOR(epoch / ${epochsPerBin})::SMALLINT AS timebin_num,
        ${cols}
      FROM ${schema}.npmrds${
    requiresTmcLength
      ? ` LEFT OUTER JOIN ${schema}.tmc_metadata_${year} AS attr USING (tmc)`
      : ''
  }
      WHERE (
        (tmc = $1)
        AND
        (
          (date >= $2) AND (date < $3)
        )
      )
      GROUP BY date, FLOOR(epoch / ${epochsPerBin})::SMALLINT
      ORDER BY date, timebin_num
  `;

  const q = {
    text: sql,
    values: [tmc, startDate, endDate]
  };

  const { rows } = await query(q);

  return rows;
};

module.exports = {
  getBinnedYearNpmrdsDataForTmc
};
