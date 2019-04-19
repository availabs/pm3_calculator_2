#!/usr/bin/env node

/* eslint no-await-in-loop: 0, no-console: 0, global-require: 0 */

const ProgressBar = require('progress');
const pLimit = require('p-limit');

const calculatorSettings = require('./src/calculatorSettings');

const OutputWriter = require('./src/storage/writers/OutputWriter');

const { year, timeBinSize } = calculatorSettings;

const { end } = require('./src/storage/services/DBService');

const { getRequestedTmcs } = require('./src/requestedTmcs');

const { getMetadataForTmcs } = require('./src/storage/daos/TmcMetadataDao');
const {
  getBinnedYearNpmrdsDataForTmc
} = require('./src/storage/daos/NpmrdsDataDao');

const NpmrdsDataEnricher = require('./src/utils/NpmrdsDataEnricher');

const CompositeCalculator = require('./src/calculators/CompositeCalculator');

if (!process.env.CALCULATOR_CONCURRENCY) {
  require('./src/loadEnvFile');
}

const limit = pLimit(process.env.CALCULATOR_CONCURRENCY || 10);

(async () => {
  try {
    const compositeCalculator = new CompositeCalculator(calculatorSettings);

    const outputWriter = new OutputWriter({
      calculatorSettings,
      calculators: compositeCalculator.calculators
    });

    const { npmrdsDataKeys, requiredTmcMetadata } = compositeCalculator;

    const tmcs = await getRequestedTmcs(calculatorSettings);
    const bar = new ProgressBar(
      ':current of :total (:percent) | :rate tmcs/sec | Elapsed :elapsed | ETA :eta',
      { total: tmcs.length }
    );

    const attrsSet = new Set(requiredTmcMetadata);
    attrsSet.add('state');

    const tmcsAttrsArr = await getMetadataForTmcs({
      year,
      tmcs,
      columns: [...attrsSet]
    });

    await Promise.all(
      tmcs.map((tmc, i) =>
        limit(async () => {
          try {
            const attrs = tmcsAttrsArr[i];
            const { state } = attrs;

            const data = await getBinnedYearNpmrdsDataForTmc({
              year,
              timeBinSize,
              state,
              tmc,
              npmrdsDataKeys
            });

            NpmrdsDataEnricher.enrichData({ year, timeBinSize, data });

            const res = await compositeCalculator.calculateForTmc({
              attrs,
              data
            });

            await outputWriter.writeCalculatorsOutput(res);

            bar.tick();
          } catch (err) {
            throw new Error(err);
          }
        })
      )
    );

    await outputWriter.writeMetadata();
    await outputWriter.end();
    console.log(`Calculator output written to ${outputWriter.outputDirPath}`);
  } catch (err) {
    console.error(err);
  } finally {
    end();
  }
})();
