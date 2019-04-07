const { query } = require('../services/DBService');

const getMetadataForTmcs = async ({ year, tmcs, columns }) => {
  const tmcsArr = Array.isArray(tmcs) ? tmcs : [tmcs];

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

  const { rows } = await query(sql, [tmcsArr]);

  return rows;
};

module.exports = {
  getMetadataForTmcs
};
