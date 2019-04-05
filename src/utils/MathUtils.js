const ss = require('simple-statistics');

const precisionRound = (number, precision = 0) => {
  if (!Number.isFinite(+number)) {
    return +number;
  }

  const factor = 10 ** precision;

  return Math.round(+number * factor) / factor;
};

const sumArray = arr => arr.reduce((acc, v) => acc + +v, 0);

const avgArray = arr => sumArray(arr) / arr.length;

const hmeanArray = arr => arr.length / arr.reduce((acc, v) => acc + 1 / +v, 0);

const numbersComparator = (a, b) => +a - +b;

const computeSummaryStats = arr => {
  if (!Array.isArray(arr)) {
    return null;
  }

  const preppedArr = arr
    .map(n => +n)
    .filter(n => Number.isFinite(n))
    .sort(numbersComparator);

  return {
    excludedCt: arr.length - preppedArr.length,
    includedCt: preppedArr.length,
    sum: preppedArr.length ? ss.sum(preppedArr) : 0,
    min: preppedArr.length ? ss.min(preppedArr[0]) : NaN,
    max: preppedArr.length ? ss.max(preppedArr[0]) : NaN,
    q1: preppedArr.length ? ss.quantileSorted(preppedArr, 0.25) : NaN,
    q3: preppedArr.length ? ss.quantileSorted(preppedArr, 0.75) : NaN,
    mean: preppedArr.length ? ss.mean(preppedArr) : NaN,
    mode: preppedArr.length ? ss.modeSorted(preppedArr) : NaN,
    median: preppedArr.length ? ss.medianSorted(preppedArr) : NaN,
    harmonicMean:
      preppedArr.length && !preppedArr.some(tt => !tt)
        ? ss.harmonicMean(preppedArr)
        : NaN,
    skewness: preppedArr.length >= 3 ? ss.sampleSkewness(preppedArr) : NaN,
    variance: preppedArr.length ? ss.variance(preppedArr) : NaN,
    standardDeviation: preppedArr.length
      ? ss.standardDeviation(preppedArr)
      : NaN,
    medianAbsoluteDeviation: preppedArr.length
      ? ss.medianAbsoluteDeviation(preppedArr)
      : NaN,
    interquartileRange: preppedArr.length
      ? ss.interquartileRange(preppedArr)
      : NaN
  };
};
module.exports = {
  precisionRound,
  sumArray,
  avgArray,
  hmeanArray,
  numbersComparator,
  computeSummaryStats
};
