/* eslint no-await-in-loop: 0 */

const TMC_SUBSET_SIZE = 1000;

const { query } = require('../services/DBService');

const getMetadataForTmcs = async ({ year, tmcs, columns }) => {
  const tmcsArr = Array.isArray(tmcs) ? tmcs.slice() : [tmcs];

  const cols = new Set(
    (Array.isArray(columns) ? columns : [columns]).filter(c => c).sort()
  );

  cols.add('tmc');

  const sql = `
    SELECT ${[...cols]}
      FROM tmc_metadata_${year}
      WHERE (
        tmc = ANY($1)
      )
  `;

  const result = [];

  while (tmcsArr.length) {
    const tmcSubset = tmcsArr.splice(0, TMC_SUBSET_SIZE);

    const { rows } = await query(sql, [tmcSubset]);

    result.push(...rows);
  }

  return result;
};

module.exports = {
  getMetadataForTmcs
};
