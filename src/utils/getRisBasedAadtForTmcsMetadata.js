const memoizeOne = require('memoize-one');

const { query } = require('../storage/services/DBService');

//  Get the latest conflation.conflation_map_<year>_v<conflation version>_ris_based_metadata view
//    for the year or its closest predecessor.
const getRisBasedAadtViewForNpmrdsYear = memoizeOne(async (year) => {
  const max_matviewname_prefix = `conflation_map_${year}_v`;
  const max_matviewname_prefix_len = max_matviewname_prefix.length;

  // Example: conflation.conflation_map_2022_v0_6_0_ris_based_metadata
  const sql = `
      SELECT
          matviewname AS table_name
        FROM pg_catalog.pg_matviews
        WHERE (
          ( schemaname = 'conflation' )
          AND
          ( matviewname ~ '^conflation_map_\\d{4}_v\\d_\\d_\\d_ris_based_metadata$' )
          AND
          ( SUBSTRING(matviewname FROM 1 FOR $1) <= $2 )
        )
        ORDER BY 1 DESC LIMIT 1
    ;
  `;

  const { rows } = await query(sql, [
    max_matviewname_prefix_len,
    max_matviewname_prefix,
  ]);

  if (rows.length === 0) {
    return null;
  }

  const [{ table_name }] = rows;

  return `conflation.${table_name}`;
});

module.exports = {
  getRisBasedAadtViewForNpmrdsYear,
};
