const CalculatorsOutputWriter = require('./CalculatorsOutputWriter');
const MetadataWriter = require('./MetadataWriter');
const mkOutputDir = require('./utils/mkOutputDir');

async function initialize() {
  const { outputDirPath, outputTimestamp } = await mkOutputDir();
  this.outputDirPath = outputDirPath;
  this.outputTimestamp = outputTimestamp;
  this.calculatorsOutputWriter = new CalculatorsOutputWriter(this);
  this.calculatorInstanceOuputFileNames = this.calculatorsOutputWriter.calculatorInstanceOuputFileNames;
}

class OutputWriter {
  constructor({ calculatorSettings, calculators }) {
    this.calculatorSettings = calculatorSettings;
    this.calculators = calculators;

    this.outputFileFormat = calculatorSettings.outputFileFormat;

    this.ready = initialize.call(this);
  }

  async writeCalculatorsOutput(calculatorsOutput) {
    await this.ready;
    return this.calculatorsOutputWriter.write(calculatorsOutput);
  }

  async writeMetadata() {
    await this.ready;
    return new MetadataWriter(this).write();
  }

  end() {
    this.calculatorsOutputWriter.end();
  }
}

module.exports = OutputWriter;
