/* eslint no-param-reassign: 0, no-console: 0 */

const { createReadStream } = require('fs');
const { join } = require('path');
const { createGunzip } = require('zlib');

const csv = require('fast-csv');
const through2 = require('through2');

const { chain, shuffle, union } = require('lodash');

const { end } = require('../../storage/services/DBService');

const { precisionRound } = require('../../utils/MathUtils');
const { getMetadataForTmcs } = require('../../storage/daos/TmcMetadataDao');

const {
  getBinnedYearNpmrdsDataForTmc
} = require('../../storage/daos/NpmrdsDataDao');

const NpmrdsDataEnricher = require('../../utils/NpmrdsDataEnricher');
const { EAV } = require('../../enums/outputFormats');

const {
  phedColMappings
} = require('../..//utils/hpmsPm3ColsToCalculatorOutputFieldsMappings');

const PhedCalculator = require('./PhedCalculator');

const timeBinSize = 15;

const CLOSENESS_PRECISION = 0;
const N = 5;

const { NPMRDS_YEAR } = process.env;

if (!NPMRDS_YEAR) {
  console.error(
    'GoldenStandard tests require the NPMRDS_YEAR env variable to be set.'
  );
  process.exit(1);
}

const goldenStandardPhedData = {};

jest.setTimeout(120000);

beforeAll(async done => {
  const csvColMappings = new Map(phedColMappings);
  csvColMappings.set('Travel_Time_Code', 'tmc');

  const csvCols = [...csvColMappings.keys()];

  const goldenStandardHpmsPm3FilePath = join(
    __dirname,
    `../../storage/static/ny.hpms.${NPMRDS_YEAR}.golden-standard.csv.gz`
  );

  const inStream = createReadStream(goldenStandardHpmsPm3FilePath);

  const csvStream = csv({ headers: true });

  const all = [];

  inStream
    .pipe(createGunzip())
    .pipe(csvStream)
    .pipe(
      through2.obj(function objStringifier(row, $, cb) {
        this.push(
          chain(row)
            .pick(csvCols)
            .mapKeys((v, k) => csvColMappings.get(k))
            .value()
        );
        cb();
      })
    )
    .on('data', d => all.push(d))
    .on('end', () => {
      const sample = shuffle(all).slice(0, N);

      sample.reduce((acc, d) => {
        const { tmc } = d;
        acc[tmc] = d;
        return acc;
      }, goldenStandardPhedData);

      done();
    });
});

test('Phed GoldenStandard Tests', done => {
  Promise.all(
    Object.keys(goldenStandardPhedData).map(async tmc => {
      const goldenStandardForTmc = goldenStandardPhedData[tmc];

      const phedCalculator = new PhedCalculator({
        year: NPMRDS_YEAR,
        outputFormat: EAV,
        timeBinSize
      });

      const { requiredTmcMetadata } = phedCalculator;

      const [attrs] = await getMetadataForTmcs({
        year: NPMRDS_YEAR,
        tmcs: tmc,
        columns: union(['tmc', 'state'], requiredTmcMetadata)
      });

      const { npmrdsDataKeys } = phedCalculator;

      const data = await getBinnedYearNpmrdsDataForTmc({
        year: NPMRDS_YEAR,
        timeBinSize,
        tmc,
        state: attrs.state,
        npmrdsDataKeys
      });

      NpmrdsDataEnricher.enrichData({ year: NPMRDS_YEAR, timeBinSize, data });

      const result = await phedCalculator.calculateForTmc({ data, attrs });

      const d = result.reduce((acc, { attribute, value }) => {
        acc[attribute] = value;
        return acc;
      }, {});

      /*
      console.log(`
        ${'#'.repeat(30)}

        ${JSON.stringify(goldenStandardForTmc, null, 4)}

        ${JSON.stringify(d, null, 4)}
      `);
      */

      [...phedColMappings.values()].forEach(k => {
        expect(
          Number.isSafeInteger(d[k])
            ? precisionRound(+goldenStandardForTmc[k])
            : +goldenStandardForTmc[k],
          `${tmc}: ${k}`
        ).toBeCloseTo(d[k], CLOSENESS_PRECISION);
      });
    })
  ).then(() => done());
});

afterAll(async done => {
  await end();
  done();
});
