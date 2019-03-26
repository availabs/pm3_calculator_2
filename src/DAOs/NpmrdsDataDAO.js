const { query } = require('../services/DBService');

const getYearNpmrdsDataForTmc = async ({
  year,
  tmc,
  state = 'public',
  columns
}) => {
  const yr = +year;

  const startDate = `01/01/${yr}`;
  const endDate = `01/01/${+yr + 1}`;

  const schema = `"${state}"`;

  const cols = (Array.isArray(columns) ? columns : [columns]).sort();

  const sql = `
    SELECT
        to_char(date, 'YYYY-MM-DD') AS date,
        epoch,
        ${cols}
      FROM ${schema}.npmrds
      WHERE (
        (tmc = $1)
        AND
        (
          (date >= $2) AND (date < $3)
        )
      )
      ORDER BY date, epoch
  `;

  const q = {
    text: sql,
    values: [tmc, startDate, endDate]
  };

  const { rows } = await query(q);

  return rows;
};

const getYearNpmrdsCountsByTimePeriod = async ({
  year,
  tmc,
  state = 'public',
  column
}) => {
  const yr = +year;

  const startDate = `01/01/${yr}`;
  const endDate = `01/01/${+yr + 1}`;

  const schema = `"${state}"`;

  const sql = `
    SELECT
        timeperiod,
        COUNT(1) AS ct
      FROM (
        SELECT
            CASE WHEN ((epoch/12) < 6 OR (epoch/12) >= 20) THEN 'OVN'
              ELSE CASE WHEN (EXTRACT(DOW FROM date)::INT % 6) = 0 THEN 'WE'
                ELSE CASE
                    WHEN (epoch/12) >= 6 AND (epoch/12) < 10 THEN 'AMP'
                    WHEN (epoch/12) >= 10 AND (epoch/12) < 16 THEN 'MIDD'
                    ELSE 'PMP'
                  END
                END
            END AS timeperiod
          FROM ${schema}.npmrds
          WHERE (
            (tmc = $1)
            AND
            (${column} IS NOT NULL)
            AND
            ( (date >= $2) AND (date < $3) )
          )
      ) AS t
      GROUP BY timeperiod
  `;

  const q = {
    text: sql,
    values: [tmc, startDate, endDate]
  };

  const { rows } = await query(q);

  return rows;
};

module.exports = {
  getYearNpmrdsDataForTmc,
  getYearNpmrdsCountsByTimePeriod
};
