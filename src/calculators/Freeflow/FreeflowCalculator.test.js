/* eslint no-param-reassign: 0 */

const { query, end } = require('../../storage/services/DBService');

const { getMetadataForTmcs } = require('../../storage/daos/TmcMetadataDao');
const {
  getBinnedYearNpmrdsDataForTmc
} = require('../../storage/daos/NpmrdsDataDao');

const NpmrdsDataEnricher = require('../../utils/NpmrdsDataEnricher');
const { IDENTITY } = require('../../enums/outputFormats');

const FreeflowCalculator = require('./FreeflowCalculator');

const YEAR = 2018;
const SIX_AM_EPOCH = 6 * 12;
const NINE_AM_EPOCH = 9 * 12;
const FOUR_PM_EPOCH = (4 + 12) * 12;
const SEVEN_PM_EPOCH = (7 + 12) * 12;
const TEN_PM_EPOCH = (10 + 12) * 12;

// Note:
//   https://www.reddit.com/r/PostgreSQL/comments/6zvie0/percentile_cont_and_percentile_disc_not/
//   https://simplestatistics.org/docs/#quantile

const CLOSENESS_PRECISION = 1;

// const timeBinSizes = [5, 15, 60];
const timeBinSizes = [15];

jest.setTimeout(120000);

describe.each(timeBinSizes)('Time Bin Size %d', timeBinSize => {
  test(`Freeflow Database Query Equivalence (timeBinSize=${timeBinSize})`, async done => {
    const randomTmcSql = `
      SELECT
          tmc
        FROM ny.tmc_metadata_${YEAR}
        OFFSET random() * (SELECT COUNT(1) FROM ny.tmc_metadata_${YEAR})
        LIMIT 1 ; `;

    const {
      rows: [{ tmc }]
    } = await query(randomTmcSql);

    const sql = `
      WITH cte_avgtts AS (
        SELECT
            tmc,
            AVG(travel_time_all_vehicles::NUMERIC) AS avg_tt,
            MIN(EXTRACT(DOW FROM date)) AS dow,  -- Need aggregate fn for parser
            MIN(epoch) AS start_epoch
          FROM ny.npmrds
          WHERE (
            (tmc = '${tmc}')
            AND
            (date >= '${YEAR}0101')
            AND
            (date < '${YEAR + 1}0101')
            AND (
              (
                (EXTRACT(DOW FROM date) BETWEEN 1 AND 5)
                AND (
                  (epoch BETWEEN ${NINE_AM_EPOCH} AND (${FOUR_PM_EPOCH} - 1))
                  OR
                  (epoch BETWEEN ${SEVEN_PM_EPOCH} AND (${TEN_PM_EPOCH} - 1))
                )
              )
              OR
              (
                (EXTRACT(DOW FROM date) NOT BETWEEN 1 AND 5)
                AND
                (epoch BETWEEN ${SIX_AM_EPOCH} AND (${TEN_PM_EPOCH} - 1))
              )
            )
          )
          GROUP BY tmc, date, FLOOR(epoch / (${timeBinSize} / 5)) /*TIME BIN*/
      )
      SELECT
          (percentile_disc(0.15) WITHIN GROUP (ORDER BY avg_tt))::NUMERIC AS freeflow_tt_db
        FROM cte_avgtts
      ;
    `;

    const { rows } = await query(sql);

    const [{ freeflow_tt_db = null } = {}] = rows;

    const freeflowCalculator = new FreeflowCalculator({
      year: YEAR,
      timeBinSize,
      outputFormat: IDENTITY
    });

    const { requiredTmcMetadata } = freeflowCalculator;

    const [attrs] = await getMetadataForTmcs({
      year: YEAR,
      tmcs: tmc,
      columns: requiredTmcMetadata
    });

    const { npmrdsDataKeys } = freeflowCalculator;

    const data = await getBinnedYearNpmrdsDataForTmc({
      year: YEAR,
      timeBinSize,
      tmc,
      state: attrs.state,
      npmrdsDataKeys
    });

    NpmrdsDataEnricher.enrichData({ year: YEAR, timeBinSize, data });

    const {
      fifteenthPctlTravelTime
    } = await freeflowCalculator.calculateForTmc({ data, attrs });

    // console.log(
    // JSON.stringify({ freeflow_tt_db, fifteenthPctlTravelTime }, null, 4)
    // );

    expect(
      fifteenthPctlTravelTime,
      `${tmc} Freeflow (timeBinSize=${timeBinSize})`
    ).toBeCloseTo(+freeflow_tt_db, CLOSENESS_PRECISION);

    done();
  });
});

afterAll(async done => {
  await end();
  done();
});
