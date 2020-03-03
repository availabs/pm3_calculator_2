/* eslint no-param-reassign: 0, global-require: 0, no-console: 0, no-await-in-loop: 0 */

const assert = require('assert');
const _ = require('lodash');
const { query, end } = require('../../storage/services/DBService');

const { getMetadataForTmcs } = require('../../storage/daos/TmcMetadataDao');
const {
  getBinnedYearNpmrdsDataForTmc
} = require('../../storage/daos/NpmrdsDataDao');

const NpmrdsDataEnricher = require('../../utils/NpmrdsDataEnricher');

const { PhedCalculator, PhedRisCalculator } = require('./');

const { IDENTITY } = require('../../enums/outputFormats');

const STATE = 'ny';
const YEAR = 2018;
const JEST_TIMEOUT = 10 * 60 * 1000; /* min * sec/min * millisec/sec */
const N = 10;
const CLOSENESS_PRECISION = 9;
const TIME_BIN_SIZE = 5;

jest.setTimeout(JEST_TIMEOUT);

const sampleTmcs = [];

const phedCalculator = new PhedCalculator({
  year: YEAR,
  timeBinSize: TIME_BIN_SIZE,
  outputFormat: IDENTITY,
  roundTravelTimes: false
});

const phedRisCalculator = new PhedRisCalculator({
  year: YEAR,
  timeBinSize: TIME_BIN_SIZE,
  outputFormat: IDENTITY,
  roundTravelTimes: false
});

const { timeBinSize } = phedCalculator;

assert(!_.isNil(timeBinSize) && timeBinSize === phedRisCalculator.timeBinSize);

// https://stackoverflow.com/a/45376129/3970755
beforeAll(async done => {
  // Get a random sample of N New York TMCs
  const sql = `
    SELECT
        tmc
      FROM ${STATE}.tmc_metadata_${YEAR}
      WHERE (
        ( aadt IS NOT NULL )
        AND
        ( aadt_singl IS NOT NULL )
        AND
        ( aadt_combi IS NOT NULL )
      )
      ORDER BY RANDOM()
      LIMIT ${N}
    ;
  `;

  const { rows } = await query(sql);

  if (_.isEmpty(rows)) {
    throw new Error('Unable to retreive sample TMCs');
  }

  for (let i = 0; i < rows.length; ++i) {
    sampleTmcs.push(rows[i].tmc);
  }

  done();
});

test('PHED and PHED_RIS are proportional to (aadt * avo) and (aadt_ris * avo_ris)', async done => {
  let numTmcsWithRisSpecificCols = 0;

  for (let i = 0; i < sampleTmcs.length; ++i) {
    const tmc = sampleTmcs[i];

    const requiredColsForTest = [
      'aadt',
      'avgVehicleOccupancy',
      'aadtRis',
      'avgVehicleOccupancyRis'
    ];

    const [
      { aadt, avgVehicleOccupancy, aadtRis, avgVehicleOccupancyRis }
    ] = await getMetadataForTmcs({
      year: YEAR,
      tmcs: tmc,
      columns: requiredColsForTest
    });

    expect(_.isNumber(aadt)).toBeTruthy();
    expect(_.isNumber(avgVehicleOccupancy)).toBeTruthy();

    expect(_.isNumber(aadtRis)).toBeTruthy();
    expect(_.isNumber(avgVehicleOccupancyRis)).toBeTruthy();

    const expectedVehHrsRatio = aadt / aadtRis;

    const expectedPerHrsRatio =
      (aadt * avgVehicleOccupancy) / (aadtRis * avgVehicleOccupancyRis);

    if (aadt !== aadtRis && avgVehicleOccupancy !== avgVehicleOccupancyRis) {
      ++numTmcsWithRisSpecificCols;
    }

    const [attrs] = await getMetadataForTmcs({
      year: YEAR,
      tmcs: tmc,
      columns: _.union(
        phedCalculator.requiredTmcMetadata,
        phedRisCalculator.requiredTmcMetadata
      )
    });

    const data = await getBinnedYearNpmrdsDataForTmc({
      year: YEAR,
      tmc,
      state: attrs.state,
      timeBinSize,
      npmrdsDataKeys: _.union(
        phedCalculator.npmrdsDataKeys,
        phedRisCalculator.npmrdsDataKeys
      )
    });

    NpmrdsDataEnricher.enrichData({ year: YEAR, timeBinSize, data });

    const phedResult = await phedCalculator.calculateForTmc({ data, attrs });
    const phedRisResult = await phedRisCalculator.calculateForTmc({
      data,
      attrs
    });

    expect(phedResult.xdelayHrs).toEqual(phedRisResult.xdelayHrs);

    expect(
      phedResult.xdelayVehHrsByVehClass.all /
        phedRisResult.xdelayVehHrsByVehClass.all
    ).toBeCloseTo(expectedVehHrsRatio, CLOSENESS_PRECISION);

    expect(
      phedResult.xdelayPerHrsByVehClass.all /
        phedRisResult.xdelayPerHrsByVehClass.all
    ).toBeCloseTo(expectedPerHrsRatio, CLOSENESS_PRECISION);
  }

  if (numTmcsWithRisSpecificCols === 0) {
    console.warn(
      'WARNING: No TMCs in the above test had RIS-specific AADT and AVO.'
    );
  }

  done();
});

afterAll(async done => {
  await end();
  done();
});
