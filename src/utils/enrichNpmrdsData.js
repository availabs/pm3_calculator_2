/* eslint no-param-reassign: 0, no-return-assign: 0 */

const enrichNpmrdsData = ({ data, enrichers }) =>
  data.forEach(row =>
    Object.keys(enrichers).forEach(k => (row[k] = enrichers[k](row)))
  );

module.exports = enrichNpmrdsData;
