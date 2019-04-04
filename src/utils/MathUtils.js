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

module.exports = {
  precisionRound,
  sumArray,
  avgArray,
  hmeanArray,
  numbersComparator
};
