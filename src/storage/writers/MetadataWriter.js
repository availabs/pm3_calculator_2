const { promisify } = require('util');
const { writeFile } = require('fs');
const { join } = require('path');
const { lowerCase } = require('lodash');

const writeFileAsync = promisify(writeFile);

const { getReferencedDatabaseTables } = require('../daos/DBStateDao');
const GitRepoState = require('../../utils/GitRepoState');

const getCalculatorInstanceConfig = require('../../utils/getCalculatorInstanceConfig');

class MetadataWriter {
  constructor({
    calculatorSettings,
    calculators,
    outputDirPath,
    outputTimestamp,
    outputFileFormat,
    calculatorInstanceOuputFileNames
  }) {
    this.metadataFilePath = join(
      outputDirPath,
      `metadata.${outputTimestamp}.${lowerCase(outputFileFormat)}`
    );

    this.calculatorSettings = calculatorSettings;

    this.calculatorsState = calculators.map((calculator, i) =>
      Object.assign({}, getCalculatorInstanceConfig(calculator), {
        outputFileName: calculatorInstanceOuputFileNames[i]
      })
    );
  }

  async write() {
    const referencedDatabaseTables = await getReferencedDatabaseTables();

    const metadata = {
      calculatorSettings: this.calculatorSettings,
      calculators: this.calculatorsState,
      gitRepoState: GitRepoState,
      referencedDatabaseTables
    };

    return writeFileAsync(this.metadataFilePath, JSON.stringify(metadata));
  }

  static end() {
    return Promise.resolve();
  }
}

module.exports = MetadataWriter;
