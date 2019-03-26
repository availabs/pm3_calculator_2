export const precisionRound = (number, precision = 0) => {
  if (!Number.isFinite(+number)) {
    return +number;
  }

  const factor = 10 ** precision;

  return Math.round(+number * factor) / factor;
};

export const sumArray = arr => arr.reduce((acc, v) => acc + +v, 0);

export const avgArray = arr => sumArray(arr) / arr.length;

export const hmeanArray = arr =>
  arr.length / arr.reduce((acc, v) => acc + 1 / +v, 0);

export const numbersComparator = (a, b) => +a - +b;
