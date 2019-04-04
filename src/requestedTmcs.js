const { year, tmcs = [], head, tail } = require('./calculatorSettings');

const requestedGeographies = require('./requestedGeographies');
const { getTmcsForGeographies } = require('./storage/daos/GeographyDao');
const { union } = require('./utils/SetUtils');

const getRequestedTmcs = async () => {
  const geographies = await requestedGeographies.getRequestedGeographies();

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
