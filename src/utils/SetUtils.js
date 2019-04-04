const { intersection, union, difference } = require('lodash');

// https://stackoverflow.com/a/43053803
const cartesianProductHelper = (a, b) =>
  [].concat(...a.map(d => b.map(e => [].concat(d, e))));

const cartesianProduct = (a, b, ...c) =>
  Array.isArray(b) && b.length
    ? cartesianProduct(cartesianProductHelper(a, b), ...c)
    : a;

module.exports = {
  cartesianProduct,
  intersection,
  difference,
  union
};
