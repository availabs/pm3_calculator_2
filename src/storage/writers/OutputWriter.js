/* eslint no-console: 0 */

const CalculatorsOutputWriter = require('./CalculatorsOutputWriter');
const CalculatorMetadataWriter = require('./CalculatorMetadataWriter');
const CombinedMetadataWriter = require('./CombinedMetadataWriter');

const getAuthoritativeVersionCandidacyDisqualifications = require('../../utils/getAuthoritativeVersionCandidacyDisqualifications');

const mkOutputDir = require('./utils/mkOutputDir');

const logAuthoritativeVersionCandicacyMessage = disqualifications => {
  if (disqualifications) {
    console.error(
      'WARNING: This calculator run is ineligible to become an authoritative version for the following reasons:'
    );
    disqualifications.forEach((disqualification, i) => {
      console.error(`\t${i + 1}. ${disqualification}`);
    });
  } else {
    console.error(
      'This calculator is eligible to become an authoritative version.'
    );
  }
};

async function initialize() {
  const { outputDirPath, outputTimestamp } = await mkOutputDir();
  this.outputDirPath = outputDirPath;
  this.outputTimestamp = outputTimestamp;

  this.calculatorsOutputWriter = new CalculatorsOutputWriter(this);
  this.calculatorInstanceOuputFileNames = this.calculatorsOutputWriter.calculatorInstanceOuputFileNames;

  this.combinedMetadataWriter.setOutputDirPath(this.outputDirPath);

  this.authoritativeVersionCandidacyDisqualifications = await getAuthoritativeVersionCandidacyDisqualifications(
    this
  );

  logAuthoritativeVersionCandicacyMessage(
    this.authoritativeVersionCandidacyDisqualifications
  );
}

class OutputWriter {
  constructor({ calculatorSettings, calculators }) {
    this.calculatorSettings = calculatorSettings;
    this.calculators = calculators;

    this.outputFileFormat = calculatorSettings.outputFileFormat;

    this.combinedMetadataWriter = new CombinedMetadataWriter(this);

    this.tmcMetadataFileName = this.combinedMetadataWriter.tmcMetadataFileName;
    this.risMetadataFileName = this.combinedMetadataWriter.risMetadataFileName;

    this.requiredTmcMetadata = this.combinedMetadataWriter.requiredTmcMetadata;

    this.ready = initialize.call(this);
  }

  async writeTmcData({ attrs, calculatorsOutput }) {
    await this.ready;
    await Promise.all([
      this.combinedMetadataWriter.write(attrs),
      this.calculatorsOutputWriter.write(calculatorsOutput)
    ]);
  }

  async writeCalculatorMetadata() {
    await this.ready;
    return new CalculatorMetadataWriter(this).write();
  }

  async end() {
    await this.combinedMetadataWriter.end();
    await this.calculatorsOutputWriter.end();
  }
}

module.exports = OutputWriter;
