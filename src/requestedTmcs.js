const requestedGeographies = require('./requestedGeographies');
const { getTmcsForGeographies } = require('./storage/daos/GeographyDao');
const { union } = require('./utils/SetUtils');

const getRequestedTmcs = async calculatorSettings => {
  const { year, tmcs = [], head, tail } = calculatorSettings;

  const geographies = await requestedGeographies.getRequestedGeographies(
    calculatorSettings
  );

  const tmcsInGeos = await getTmcsForGeographies({
    year,
    geographies
  });

  return union(tmcs, tmcsInGeos)
    .filter(tmc => tmc)
    .sort()
    .filter((_, i) => head === undefined || i < head)
    .filter((_, i, arr) => tail === undefined || i >= arr.length - tail);
};

module.exports = { getRequestedTmcs };
