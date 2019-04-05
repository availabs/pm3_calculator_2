/* eslint import/no-dynamic-require: 0, global-require: 0 */

const { fileSync } = require('find');

const rulesFilesPaths = fileSync(/Rules.js/, __dirname);

module.exports = rulesFilesPaths.reduce(
  (acc, path) => {
    const { measure, configDefaults, configOptions } = require(path);

    if (measure) {
      acc.names[measure] = measure;
      acc.configDefaults[measure] = configDefaults || null;
      acc.configOptions[measure] = configOptions || null;
    }

    return acc;
  },
  { names: {}, configDefaults: {}, configOptions: {} }
);
