#!/usr/bin/env node

/* eslint no-await-in-loop: 0, no-console: 0 */

const argv = require('minimist')(process.argv.slice(2), {
  string: ['geocode']
});

const { end } = require('./src/services/DBService');

const { getTmcMetadataForGeography } = require('./src/DAOs/TmcMetadataDao');

const {
  calculateForTmc
} = require('./src/calculators/percentEpochsReportingByPeak.all-db');

const { year, state, geolevel, geocode } = argv;

(async () => {
  try {
    console.error({ year, state, geolevel, geocode });
    const tmcMetadata = await getTmcMetadataForGeography({
      year,
      state,
      geolevel,
      geocode,
      columns: ['state']
    });

    await Promise.all(
      tmcMetadata.map(async ({ tmc, state: tmcState }) => {
        const pctEpochsReporting = await calculateForTmc({
          year,
          state: tmcState,
          tmc
        });
        console.log(
          JSON.stringify(
            Object.assign({ tmc, year, state: tmcState }, pctEpochsReporting)
          )
        );
      })
    );

    end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
