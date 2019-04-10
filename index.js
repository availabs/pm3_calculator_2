#!/usr/bin/env node

/* eslint no-await-in-loop: 0, no-console: 0 */

const calculatorSettings = require('./src/calculatorSettings');

const CalculatorsOutputWriter = require('./src/storage/writers/CalculatorsOutputWriter');

const { year, timeBinSize } = calculatorSettings;

const {
  // getDatabaseQueryRelationDependencies,
  end
} = require('./src/storage/services/DBService');

const { getRequestedTmcs } = require('./src/requestedTmcs');

const { getMetadataForTmcs } = require('./src/storage/daos/TmcDao');
const {
  getBinnedYearNpmrdsDataForTmc
} = require('./src/storage/daos/NpmrdsDataDAO');

const NpmrdsDataEnricher = require('./src/utils/NpmrdsDataEnricher');

const CompositeCalculator = require('./src/calculators/CompositeCalculator');

(async () => {
  try {
    const tmcs = await getRequestedTmcs(calculatorSettings);

    const compositeCalculator = new CompositeCalculator(calculatorSettings);

    const outputWriter = new CalculatorsOutputWriter(
      compositeCalculator.calculators
    );

    const {
      calculators,
      npmrdsDataKeys,
      requiredTmcAttributes
    } = compositeCalculator;

    console.log(JSON.stringify(calculators));

    const attrsSet = new Set(requiredTmcAttributes);
    attrsSet.add('state');

    const tmcsAttrsArr = await getMetadataForTmcs({
      year,
      tmcs,
      columns: [...attrsSet]
    });

    await Promise.all(
      tmcs.map(
        (tmc, i) =>
          new Promise(async resolve => {
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

            await outputWriter.write(res);
            resolve();
          })
      )
    );

    outputWriter.end();

    // const databaseQueryRelationDependencies = await getDatabaseQueryRelationDependencies();
    // console.log(JSON.stringify(databaseQueryRelationDependencies, null, 4));
  } catch (err) {
    console.error(err);
  } finally {
    end();
  }
})();
