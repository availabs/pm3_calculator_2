const { lowerCase } = require('lodash');

const measureOutputFileCounts = {};

const getCalculatorInstanceOutputFileName = ({
  calculator,
  outputFileFormat
}) => {
  const { measure } = calculator.constructor;

  measureOutputFileCounts[measure] = measureOutputFileCounts[measure] || 0;
  ++measureOutputFileCounts[measure];

  const filename = `${lowerCase(measure)}-${
    measureOutputFileCounts[measure]
  }.${lowerCase(outputFileFormat)}`;

  return filename;
};

module.exports = getCalculatorInstanceOutputFileName;
