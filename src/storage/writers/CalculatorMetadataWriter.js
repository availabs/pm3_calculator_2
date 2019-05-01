const { promisify } = require('util');
const { writeFile } = require('fs');
const { join } = require('path');

const writeFileAsync = promisify(writeFile);

const {
  connectionInfo,
  getReferencedDatabaseTables
} = require('../daos/DBStateDao');
const GitRepoState = require('../../utils/GitRepoState');

const getCalculatorInstanceConfig = require('../../utils/getCalculatorInstanceConfig');

class MetadataWriter {
  constructor({
    calculatorSettings,
    calculators,
    outputDirPath,
    outputTimestamp,
    calculatorInstanceOuputFileNames,
    tmcMetadataFileName
  }) {
    this.timestamp = outputTimestamp;

    // Output file format for calculator_metadata is always JSON.
    this.filePath = join(outputDirPath, `calculator_metadata.json`);

    this.calculatorSettings = calculatorSettings;

    this.calculatorsState = calculators.map((calculator, i) =>
      Object.assign({}, getCalculatorInstanceConfig(calculator), {
        outputFileName: calculatorInstanceOuputFileNames[i]
      })
    );

    this.tmcMetadataFileName = tmcMetadataFileName;
  }

  async write() {
    const referencedDatabaseTables = await getReferencedDatabaseTables();

    const metadata = {
      timestamp: this.timestamp,
      calculatorSettings: this.calculatorSettings,
      calculators: this.calculatorsState,
      gitRepoState: GitRepoState,
      dbState: {
        connectionInfo,
        referencedDatabaseTables
      }
    };

    if (this.tmcMetadataFileName) {
      metadata.tmcMetadataFileName = this.tmcMetadataFileName;
    }

    return writeFileAsync(this.filePath, JSON.stringify(metadata));
  }

  static end() {
    return Promise.resolve();
  }
}

module.exports = MetadataWriter;
