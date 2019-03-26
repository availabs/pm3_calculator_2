const { query } = require('../services/DBService');

const getTmcMetadataForGeography = async ({
  year,
  state,
  geolevel,
  geocode,
  columns
}) => {
  const schema = state ? `"${state}"` : 'public';

  const geoClause =
    geolevel && geocode
      ? `WHERE (${geolevel.toLowerCase()}_code = '${geocode}')`
      : '';

  const cols = new Set(
    (Array.isArray(columns) ? columns : [columns]).filter(c => c).sort()
  );
  cols.add('tmc');

  const sql = `
    SELECT ${[...cols]}
      FROM ${schema}.tmc_metadata_${year}
      ${geoClause}
  `;

  console.error(sql);

  const { rows } = await query(sql);

  return rows;
};

module.exports = {
  getTmcMetadataForGeography
};
