const { promisify } = require('util');
const { writeFile } = require('fs');
const { join } = require('path');

const { isEqual, isNil } = require('lodash');

const { ARITHMETIC } = require('../../enums/meanTypes');
const { EAV } = require('../../enums/outputFormats');
const { NDJSON } = require('../../enums/outputFileFormats');

const {
  names: { LOTTR, TTTR, PHED },
  configDefaults
} = require('../../calculators/MeasureMetadata');

const writeFileAsync = promisify(writeFile);

const {
  connectionInfo,
  getReferencedDatabaseTables
} = require('../daos/DBStateDao');

const GitRepoState = require('../../utils/GitRepoState');

const getCalculatorInstanceConfig = require('../../utils/getCalculatorInstanceConfig');

const buildMeasureDefaultRunChecker = calculators => measure => {
  return calculators.some(calculator => {
    const calcInstanceConfig = getCalculatorInstanceConfig(calculator);
    return (
      calcInstanceConfig.measure === measure &&
      calcInstanceConfig.timeBinSize === 15 &&
      calcInstanceConfig.meanType === ARITHMETIC &&
      calcInstanceConfig.roundTravelTimes &&
      Object.keys(configDefaults[measure]).every(k =>
        isEqual(calcInstanceConfig[k], configDefaults[measure][k])
      )
    );
  });
};

const isAuthorativeVersionCandidate = (calculatorSettings, calculators) => {
  const {
    head,
    tail,
    geolevel,
    geocode,
    geoname,
    tmcs,
    states,
    outputHPMSRequiredTmcMetadata,
    outputFormat,
    outputFileFormat
  } = calculatorSettings;

  const defaultRunChecker = buildMeasureDefaultRunChecker(calculators);

  // Ensure tmcs are not a subset or superset of a state's tmcs.
  let isCandidate = true;

  isCandidate =
    isCandidate && outputFormat === EAV && outputFileFormat === NDJSON;

  // Single, complete state
  isCandidate = isCandidate && isNil(head) && isNil(tail) && isNil(tmcs);

  isCandidate =
    isCandidate &&
    (isNil(geolevel) ||
      (geolevel === 'STATE' &&
        (!Array.isArray(geocode) || geocode.length === 1) &&
        (!Array.isArray(geoname) || geoname.length === 1)));

  isCandidate = isCandidate && (!Array.isArray(states) || states.length === 1);

  // Includes the HPMS required tmc metadata
  isCandidate = isCandidate && outputHPMSRequiredTmcMetadata;

  // Includes the default (FinalRule specified) runs of each PM3 measure
  isCandidate =
    isCandidate &&
    defaultRunChecker(LOTTR) &&
    defaultRunChecker(TTTR) &&
    defaultRunChecker(PHED);

  return isCandidate;
};

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

    this.authorativeVersionCandidate = isAuthorativeVersionCandidate(
      calculatorSettings,
      calculators
    );
  }

  async write() {
    const referencedDatabaseTables = await getReferencedDatabaseTables();

    const metadata = {
      authorativeVersionCandidate: this.authorativeVersionCandidate,
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
