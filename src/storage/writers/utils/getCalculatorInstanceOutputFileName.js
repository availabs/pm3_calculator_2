const { lowerCase } = require('lodash');

const getCalculatorInstanceConfig = require('../../../utils/getCalculatorInstanceConfig');

const measureOutputFileCounts = {};

const getCalculatorInstanceOutputFileName = ({
  calculator,
  outputFileFormat,
}) => {
  const { measure } = getCalculatorInstanceConfig(calculator);

  measureOutputFileCounts[measure] = measureOutputFileCounts[measure] || 0;
  ++measureOutputFileCounts[measure];

  const filename = `${lowerCase(measure)}-${
    measureOutputFileCounts[measure]
  }.${lowerCase(outputFileFormat)}`;

  return filename.replace(/ /g, '_');
};

module.exports = getCalculatorInstanceOutputFileName;
