/* eslint no-param-reassign: 0 */

const { get } = require('lodash');
const { query, end } = require('../../storage/services/DBService');

const { getMetadataForTmcs } = require('../../storage/daos/TmcMetadataDao');
const {
  getBinnedYearNpmrdsDataForTmc
} = require('../../storage/daos/NpmrdsDataDao');

const NpmrdsDataEnricher = require('../../utils/NpmrdsDataEnricher');
const { IDENTITY } = require('../../enums/outputFormats');
const { AMP, PMP } = require('../../enums/pm3TimePeriods');

const PlanningTimeIndexCalculator = require('./PlanningTimeIndexCalculator');

const YEAR = 2018;
const SIX_AM_EPOCH = 6 * 12;
const NINE_AM_EPOCH = 9 * 12;
const FOUR_PM_EPOCH = (4 + 12) * 12;
const SEVEN_PM_EPOCH = (7 + 12) * 12;
const TEN_PM_EPOCH = (10 + 12) * 12;

const CLOSENESS_PRECISION = 2;

const timeBinSizes = [5, 15, 60];

jest.setTimeout(120000);

describe.each(timeBinSizes)('Time Bin Size %d', timeBinSize => {
  test(`PTI Database Query Equivalence (timeBinSize=${timeBinSize})`, async done => {
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
      BEGIN;

      CREATE TEMPORARY TABLE tmp_avgtts
        ON COMMIT DROP AS
        SELECT
            tmc,
            AVG(NULLIF(travel_time_all_vehicles, 0)::NUMERIC) AS avg_tt,
            MIN(EXTRACT(DOW FROM date)) AS dow,  -- Need aggregate fn for parser
            MIN(epoch) AS start_epoch
          FROM ny.npmrds
          WHERE (
            (tmc = '${tmc}')
            AND
            (date >= '${YEAR}0101')
            AND
            (date < '${YEAR + 1}0101')
            AND
            (epoch BETWEEN ${SIX_AM_EPOCH} AND (${TEN_PM_EPOCH} - 1))
          )
          GROUP BY tmc, date, FLOOR(epoch / (${timeBinSize} / 5)) /*TIME BIN*/
      ;
            
      CREATE TEMPORARY TABLE tmp_freeflow
        ON COMMIT DROP AS
        SELECT
            (percentile_disc(0.15) WITHIN GROUP (ORDER BY avg_tt))::NUMERIC AS freeflow_tt
          FROM tmp_avgtts
          WHERE (
            (dow NOT BETWEEN 1 AND 5)
            OR
            (start_epoch BETWEEN ${NINE_AM_EPOCH} AND (${FOUR_PM_EPOCH} - 1))
            OR
            (start_epoch >= ${SEVEN_PM_EPOCH})
          )
      ;

      SELECT
          freeflow_tt
        FROM tmp_freeflow
      ;

      SELECT
          '*' AS peak,
          (
            ((percentile_disc(0.95) WITHIN GROUP (ORDER BY avg_tt))::NUMERIC)
            /
            (SELECT freeflow_tt FROM tmp_freeflow)
          ) AS pti
        FROM tmp_avgtts
        WHERE (
          (dow BETWEEN 1 AND 5)
          AND (
            (start_epoch BETWEEN ${SIX_AM_EPOCH} AND (${NINE_AM_EPOCH} - 1))
            OR
            (start_epoch BETWEEN ${FOUR_PM_EPOCH} AND (${SEVEN_PM_EPOCH} - 1))
          )
        )
      UNION
      SELECT
          '${AMP}' AS peak,
          (
            ((percentile_disc(0.95) WITHIN GROUP (ORDER BY avg_tt))::NUMERIC)
            /
            (SELECT freeflow_tt FROM tmp_freeflow)
          ) AS pti
        FROM tmp_avgtts
        WHERE (
          (dow BETWEEN 1 AND 5)
          AND
          (start_epoch BETWEEN ${SIX_AM_EPOCH} AND (${NINE_AM_EPOCH} - 1))
        )
      UNION
      SELECT
          '${PMP}' AS peak,
          (
            ((percentile_disc(0.95) WITHIN GROUP (ORDER BY avg_tt))::NUMERIC)
            /
            (SELECT freeflow_tt FROM tmp_freeflow)
          ) AS pti
        FROM tmp_avgtts
        WHERE (
          (dow BETWEEN 1 AND 5)
          AND
          (start_epoch BETWEEN ${FOUR_PM_EPOCH} AND (${SEVEN_PM_EPOCH} - 1))
        )
      ;

    COMMIT;
    `;

    const dbResult = await query(sql);

    const {
      rows: [{ freeflow_tt } = {}]
    } = dbResult[3];

    const { rows: ptiRows } = dbResult[4];

    const dbResultsByPeak = ptiRows.reduce((acc, { pti, peak }) => {
      acc[peak] = pti === null ? null : +pti;
      return acc;
    }, {});

    const ptiCalculator = new PlanningTimeIndexCalculator({
      year: YEAR,
      timeBinSize,
      outputFormat: IDENTITY
    });

    ptiCalculator.calculateFreeflow = () => ({
      fifteenthPctlTravelTime: freeflow_tt
    });

    const { requiredTmcMetadata } = ptiCalculator;

    const [attrs] = await getMetadataForTmcs({
      year: YEAR,
      tmcs: tmc,
      columns: requiredTmcMetadata
    });

    const { npmrdsDataKeys } = ptiCalculator;

    const data = await getBinnedYearNpmrdsDataForTmc({
      year: YEAR,
      timeBinSize,
      tmc,
      state: attrs.state,
      npmrdsDataKeys
    });

    NpmrdsDataEnricher.enrichData({ year: YEAR, timeBinSize, data });

    const result = await ptiCalculator.calculateForTmc({ data, attrs });

    expect(
      get(dbResultsByPeak, '*', null),
      `${tmc} PTI (cross-peak, timeBinSize=${timeBinSize})`
    ).toBeCloseTo(get(result, 'pti', null), CLOSENESS_PRECISION);

    [AMP, PMP].forEach(peak => {
      expect(
        get(dbResultsByPeak, peak, null),
        `${tmc} PTI (peak=${peak}, timeBinSize=${timeBinSize})`
      ).toBeCloseTo(
        get(result, ['ptiByTimePeriod', peak], null),
        CLOSENESS_PRECISION
      );
    });

    done();
  });
});

afterAll(async done => {
  await end();
  done();
});
