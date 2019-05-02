const { promisify } = require('util');
const { writeFile } = require('fs');
const { join } = require('path');

const writeFileAsync = promisify(writeFile);

const { getRequestedGeographies } = require('../../requestedGeographies');

const {
  connectionInfo,
  getReferencedDatabaseTables
} = require('../daos/DBStateDao');

const GitRepoState = require('../../utils/GitRepoState');

const getCalculatorInstanceConfig = require('../../utils/getCalculatorInstanceConfig');

const representsSingleCompleteState = async ({ calculatorSettings }) => {
  const requestedGeographies = await getRequestedGeographies(
    calculatorSettings
  );

  if (
    !Array.isArray(requestedGeographies) ||
    requestedGeographies.length > 1 ||
    requestedGeographies[0].geolevel !== 'STATE'
  ) {
    return null;
  }

  const [
    {
      states: [state]
    }
  ] = requestedGeographies;

  return state;
};

class MetadataWriter {
  constructor({
    calculatorSettings,
    calculators,
    outputDirPath,
    outputTimestamp,
    calculatorInstanceOuputFileNames,
    tmcMetadataFileName,
    authoritativeVersionCandidacyDisqualifications
  }) {
    this.timestamp = outputTimestamp;

    // Output file format for calculator_metadata is always JSON.
    this.filePath = join(outputDirPath, `calculator_metadata.json`);

    this.calculatorSettings = calculatorSettings;

    this.calculators = calculators;
    this.calculatorsState = this.calculators.map((calculator, i) =>
      Object.assign({}, getCalculatorInstanceConfig(calculator), {
        outputFileName: calculatorInstanceOuputFileNames[i]
      })
    );

    this.tmcMetadataFileName = tmcMetadataFileName;

    this.authoritativeVersionCandidacyDisqualifications = authoritativeVersionCandidacyDisqualifications;
  }

  async write() {
    const singleCompleteState =
      !this.authoritativeVersionCandidacyDisqualifications &&
      (await representsSingleCompleteState(this));

    this.authoritativeVersionCandidate = !this
      .authoritativeVersionCandidacyDisqualifications;

    const referencedDatabaseTables = await getReferencedDatabaseTables();

    const metadata = {
      state: singleCompleteState,
      authoritativeVersionCandidate: this.authoritativeVersionCandidate,
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

    if (this.authoritativeVersionCandidacyDisqualifications) {
      metadata.authoritativeVersionCandidacyDisqualifications = this.authoritativeVersionCandidacyDisqualifications;
    }

    return writeFileAsync(this.filePath, JSON.stringify(metadata));
  }

  static end() {
    return Promise.resolve();
  }
}

module.exports = MetadataWriter;
