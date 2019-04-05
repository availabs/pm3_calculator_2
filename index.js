#!/usr/bin/env node

/* eslint no-await-in-loop: 0 */

const { end } = require('./src/storage/services/DBService');
const { getRequestedTmcs } = require('./src/requestedTmcs');

const { getMetadataForTmcs } = require('./src/storage/daos/TmcDao');
const {
  getBinnedYearNpmrdsDataForTmc
} = require('./src/storage/daos/NpmrdsDataDAO');

const NpmrdsDataEnricher = require('./src/utils/NpmrdsDataEnricher');

const CompositeCalculator = require('./src/calculators/CompositeCalculator');

// console.log(JSON.stringify(require('../src/calculatorSettings'), null, 4));

// process.exit();

(async () => {
  try {
    const tmcs = await getRequestedTmcs();

    const compositeCalculator = new CompositeCalculator();
    const {
      calculators,
      npmrdsDataSources,
      requiredTmcAttributes
    } = compositeCalculator;

    console.log(JSON.stringify(calculators));

    const attrsSet = new Set(requiredTmcAttributes);
    attrsSet.add('state');

    const tmcsAttrsArr = await getMetadataForTmcs({
      tmcs,
      columns: [...attrsSet]
    });

    for (let i = 0; i < tmcs.length; ++i) {
      const attrs = tmcsAttrsArr[i];
      const { tmc, state } = attrs;

      const data = await getBinnedYearNpmrdsDataForTmc({
        state,
        tmc,
        npmrdsDataSources
      });

      NpmrdsDataEnricher.enrichData(data);

      const res = await compositeCalculator.calculateForTmc({ attrs, data });

      console.log(JSON.stringify(res));
    }
  } catch (err) {
    console.error(err);
  } finally {
    end();
  }
})();
