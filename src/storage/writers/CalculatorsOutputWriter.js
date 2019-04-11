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
  constructor({
    calculators,
    outputDirPath,
    outputTimestamp,
    outputFileFormat
  }) {
    this.calculators = calculators;

    this.calculatorInstanceOuputFileNames = this.calculators.map(calculator =>
      getCalculatorInstanceOutputFileName({
        calculator,
        outputTimestamp,
        outputFileFormat
      })
    );

    const createTransformStream = transformStreamCreators[outputFileFormat];

    this.calculatorInstanceOutputStreams = this.calculatorInstanceOuputFileNames.map(
      fileName => {
        const stream = createTransformStream();

        stream.pipe(createWriteStream(join(outputDirPath, fileName)));
        stream.setMaxListeners(Number.POSITIVE_INFINITY);

        return stream;
      }
    );
  }

  async write(calculatorsOutput) {
    return Promise.all(
      calculatorsOutput.map(async (output, i) => {
        const stream = this.calculatorInstanceOutputStreams[i];

        const rows = Array.isArray(output) ? output : [output];

        for (let j = 0; j < rows.length; ++j) {
          // if (!stream.write(rows[j])) {
          // await new Promise(resolve =>
          // stream.once('drain', () => process.nextTick(resolve))
          // );
          // }
          stream.write(rows[j]);
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
