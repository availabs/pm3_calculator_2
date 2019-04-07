const { query } = require('../services/DBService');

const { getNpmrdsMetricKey } = require('../../utils/NpmrdsMetricKey');

const { TRAVEL_TIME } = require('../../enums/npmrdsMetrics');

const { HARMONIC } = require('../../enums/meanTypes');

const MINUTES_PER_EPOCH = 5;

const getBinnedYearNpmrdsDataForTmc = async ({
  year,
  timeBinSize,
  meanType,
  tmc,
  state,
  npmrdsDataSources
}) => {
  if (!Array.isArray(npmrdsDataSources)) {
    throw new Error('ERROR: npmrdsDataSources params is required');
  }
  const yr = +year;

  const startDate = `01/01/${yr}`;
  const endDate = `01/01/${+yr + 1}`;

  const schema = `"${state || 'public'}"`;
  console.log('dataSources:', npmrdsDataSources);

  const cols = npmrdsDataSources
    .sort()
    .map(dataSource => {
      const metric_key = getNpmrdsMetricKey({
        dataSource,
        metric: TRAVEL_TIME
      });

      return meanType === HARMONIC
        ? `(
        COUNT(${metric_key})::DOUBLE PRECISION
        /
        SUM(
          1::DOUBLE PRECISION
          /
          ${metric_key}::DOUBLE PRECISION
        )
      ) AS ${metric_key}`
        : `AVG(${metric_key}) AS ${metric_key}`;
    })
    .join(', ');

  const epochsPerBin = Math.floor(timeBinSize / MINUTES_PER_EPOCH);

  const sql = `
    SELECT
        to_char(date, 'YYYY-MM-DD') AS date,
        FLOOR(epoch / ${epochsPerBin})::SMALLINT AS timebin_num,
        ${cols}
      FROM ${schema}.npmrds
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
