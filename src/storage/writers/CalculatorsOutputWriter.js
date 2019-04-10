const { createWriteStream } = require('fs');
const { join } = require('path');

const getCalculatorInstanceOutputFileName = require('./utils/getCalculatorInstanceOutputFileName');
const mkOutputDir = require('./utils/mkOutputDir');

async function initialize() {
  this.outputDir = await mkOutputDir();
}

class CalculatorsOutputFilesWriter {
  constructor(calculators) {
    this.calculators = calculators;

    this.calculatorInstanceOuputFileNames = this.calculators.map(calculator =>
      getCalculatorInstanceOutputFileName(calculator)
    );

    initialize.call(this);
  }

  async write(calculatorsOutput) {
    await this.outputDir;

    this.calculatorInstanceOutputStreams =
      this.calculatorInstanceOutputStreams ||
      this.calculatorInstanceOuputFileNames.map(fileName =>
        createWriteStream(join(this.outputDir, fileName))
      );

    return Promise.all(
      calculatorsOutput.map(
        (output, i) =>
          new Promise(async resolve => {
            const writer = this.calculatorInstanceOutputStreams[i];

            const rows = Array.isArray(output) ? output : [output];

            for (let j = 0; j < rows.length; ++j) {
              if (!writer.write(`${JSON.stringify(rows[j])}\n`)) {
                writer.on('drain', resolve);
              } else {
                resolve();
              }
            }
          })
      )
    );
  }

  end() {
    if (this.calculatorInstanceOutputStreams) {
      this.calculatorInstanceOutputStreams.forEach(outStream =>
        outStream.end()
      );
    }
  }
}

module.exports = CalculatorsOutputFilesWriter;
