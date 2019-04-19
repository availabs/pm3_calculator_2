const { query } = require('../services/DBService');
const {
  cartesianProduct,
  intersection,
  union,
  uniq
} = require('../../utils/SetUtils');

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

    const metricValueExpression =
      npmrdsMetric === TRAVEL_TIME
        ? `NULLIF(${npmrdsTableCol}::NUMERIC, 0)::NUMERIC`
        : `(attr.miles::NUMERIC / NULLIF(${npmrdsTableCol}::NUMERIC, 0)::NUMERIC * 3600::NUMERIC)`;

    if (meanType === ARITHMETIC) {
      acc[npmrdsDataKey] = `
        AVG(${metricValueExpression})::NUMERIC AS ${npmrdsDataKey}`;
    } else if (meanType === HARMONIC) {
      acc[npmrdsDataKey] = `
        (
          COUNT(${npmrdsTableCol})::NUMERIC
          /
          SUM(
            1::NUMERIC
            /
            ${metricValueExpression}
          )::NUMERIC
        )::NUMERIC AS ${npmrdsDataKey}`;
    }
  } else if (npmrdsMetric === DATA_DENSITY) {
    const npmrdsTableCol = getNpmrdsTableColumn(params);
    acc[npmrdsDataKey] = `MAX(${npmrdsTableCol}) AS ${npmrdsDataKey}`;
  }

  return acc;
}, {});

const allNpmrdsDataKeys = Object.keys(npmrdsDataKey2SqlTable);
const numericFieldNpmrdsDataKeys = allNpmrdsDataKeys.filter(
  k => parseNpmrdsDataKey(k).npmrdsMetric !== DATA_DENSITY
);

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

  const unrecognizedNpmrdsDataKeys = cols.reduce((acc, col, i) => {
    if (!col) {
      acc.push(npmrdsDataKeys[i]);
    }
    return acc;
  }, []);

  if (unrecognizedNpmrdsDataKeys.length) {
    throw new Error(
      `ERROR: unrecognized npmrdsDataKeys ${unrecognizedNpmrdsDataKeys}`
    );
  }

  const requiresTmcLength = npmrdsDataKeys.some(
    npmrdsDataKey => parseNpmrdsDataKey(npmrdsDataKey).npmrdsMetric === SPEED
  );

  const epochsPerBin = Math.floor(timeBinSize / MINUTES_PER_EPOCH);

  const sql = `
    SELECT
        tmc,
        to_char(date, 'YYYY-MM-DD') AS date,
        FLOOR(epoch::NUMERIC / ${epochsPerBin}::NUMERIC)::SMALLINT AS "timeBinNum",
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
      GROUP BY tmc, date, FLOOR(epoch::NUMERIC / ${epochsPerBin}::NUMERIC)::SMALLINT
  `;

  const q = {
    text: sql,
    values: [tmc, startDate, endDate]
  };

  const { rows } = await query(q);

  // NOTE: pg-node return NUMERIC values as strings
  rows.forEach(row => {
    union(intersection(numericFieldNpmrdsDataKeys, npmrdsDataKeys)).forEach(
      k => {
        // eslint-disable-next-line no-param-reassign
        row[k] = row[k] === null ? null : +row[k];
      }
    );
  });

  return rows;
};

module.exports = {
  getBinnedYearNpmrdsDataForTmc
};
