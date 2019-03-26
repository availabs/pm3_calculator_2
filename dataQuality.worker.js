#!/usr/bin/env node

/* eslint no-console: 0, no-await-in-loop: 0 */

const {
  calculateForTmc
} = require('./src/calculators/percentEpochsReportingByPeak');

process.on('message', async ({ year, state, tmc }) => {
  const pctEpochsReporting = await calculateForTmc({
    year,
    state,
    tmc
  });

  console.log(
    JSON.stringify(Object.assign({ tmc, year, state }, pctEpochsReporting))
  );
});
