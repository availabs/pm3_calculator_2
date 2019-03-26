#!/usr/bin/env node

/* eslint no-console: 0 */

const { fork } = require('child_process');
const { join } = require('path');

const split2 = require('split2');
const argv = require('minimist')(process.argv.slice(2), {
  string: ['geocode']
});

const { end } = require('./src/services/DBService');
const { getTmcMetadataForGeography } = require('./src/DAOs/TmcMetadataDao');

const { year, state, geolevel, geocode } = argv;
const numWorkers = 10;

(async () => {
  console.error({ year, state, geolevel, geocode });

  const tmcMetadata = await getTmcMetadataForGeography({
    year,
    state,
    geolevel,
    geocode,
    columns: ['state']
  });

  for (let i = 0; i < numWorkers; ++i) {
    const worker = fork(join(__dirname, './dataQuality.worker.js'), {
      stdio: ['ipc', 'pipe']
    });

    worker.stdout.pipe(split2()).on('data', line => {
      if (tmcMetadata.length) {
        worker.send(Object.assign({ year }, tmcMetadata.pop()));
      } else {
        worker.kill();
      }

      console.log(line);
    });

    worker.send(Object.assign({ year }, tmcMetadata.pop()));
  }

  end();
})();
