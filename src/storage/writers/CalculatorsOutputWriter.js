/* eslint no-await-in-loop: 0 */

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
      calculatorsOutput.map(async (output, i) => {
        const stream = this.calculatorInstanceOutputStreams[i];

        const rows = Array.isArray(output) ? output : [output];

        for (let j = 0; j < rows.length; ++j) {
          stream.write(`${JSON.stringify(rows[j])}\n`);
        }
      })
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
