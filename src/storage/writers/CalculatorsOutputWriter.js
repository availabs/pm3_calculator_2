/* eslint no-await-in-loop: 0 */

const { createWriteStream } = require('fs');
const { join } = require('path');

const getCalculatorInstanceOutputFileName = require('./utils/getCalculatorInstanceOutputFileName');
const createNDJSONTransformStream = require('./utils/createNDJSONTransformStream');
const createCSVTransformStream = require('./utils/createCSVTransformStream');

const { NDJSON, CSV } = require('../../enums/outputFileFormats');

const transformStreamCreators = {
  [NDJSON]: createNDJSONTransformStream,
  [CSV]: createCSVTransformStream
};

class CalculatorsOutputFilesWriter {
  constructor({ calculators, outputDirPath, outputFileFormat }) {
    this.calculators = calculators;

    this.calculatorInstanceOuputFileNames = this.calculators.map(calculator =>
      getCalculatorInstanceOutputFileName({
        calculator,
        outputFileFormat
      })
    );

    const createTransformStream = transformStreamCreators[outputFileFormat];

    this.calculatorInstanceOutputStreams = this.calculatorInstanceOuputFileNames.map(
      fileName => {
        const stream = createTransformStream();

        stream.pipe(createWriteStream(join(outputDirPath, fileName)));

        return stream;
      }
    );
  }

  async write(calculatorsOutput) {
    return Promise.all(
      calculatorsOutput.map(async (output, i) => {
        const stream = this.calculatorInstanceOutputStreams[i];

        const rows = (Array.isArray(output) ? output : [output]).filter(r => r);

        if (!rows.length) {
          return;
        }

        await Promise.all(
          rows.map(row => new Promise(resolve => stream.write(row, resolve)))
        );
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
