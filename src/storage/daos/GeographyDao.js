const { query } = require('../services/DBService');

const getGeographyAttributesQueryCriteria = ({
  geolevel,
  geocode,
  geoname,
  states,
  state_codes
}) => {
  const whereClauses = [];
  const parameterizedValues = [];

  if (geolevel) {
    parameterizedValues.push(geolevel.toUpperCase());
    whereClauses.push(`geography_level = $${parameterizedValues.length}`);
  }

  if (geocode) {
    parameterizedValues.push(geocode);
    whereClauses.push(`geography_level_code = $${parameterizedValues.length}`);
  }

  if (geoname) {
    parameterizedValues.push(geoname);
    whereClauses.push(
      `UPPER(geography_level_name) = UPPER($${parameterizedValues.length})`
    );
  }

  if (states) {
    parameterizedValues.push(states.map(s => s.toLowerCase()));
    whereClauses.push(`states = $${parameterizedValues.length}`);
  }

  if (state_codes) {
    parameterizedValues.push(state_codes);
    whereClauses.push(`state_codes = $${parameterizedValues.length}`);
  }

  return { whereClauses, parameterizedValues };
};

const getGeographyAttributes = async geographyDescriptor => {
  const {
    whereClauses,
    parameterizedValues
  } = getGeographyAttributesQueryCriteria(geographyDescriptor);

  if (!whereClauses.length) {
    throw new Error(
      'ERROR: This function expects a geographyDescriptor that uniquely identifies a geography'
    );
  }

  const geoAttrsSQL = `
		SELECT 
				geolevel,
				geocode,
				geoname,
				states,
				state_codes
			FROM (
				SELECT
						geography_level AS geolevel,
						geography_level_code AS geocode,
						geography_level_name AS geoname,
						states,
						state_codes,
						rank() OVER (
							PARTITION BY geography_level, geography_level_code
							ORDER BY array_length(states, 1) DESC
						)
					FROM geography_metadata
					WHERE (
						${whereClauses.map(c => `(${c})`).join(' AND ')}
					)
			) AS sub
			WHERE rank = 1
  `;

  const { rows } = await query(geoAttrsSQL, parameterizedValues);

  if (rows.length > 1) {
    throw new Error(`
			ERROR: Geography level description is ambiguous.
			More than one returned from database based on description.
		`);
  }

  return rows[0] || null;
};

const getTmcsForGeographiesQueryCriteria = geographies => {
  const whereClauses = [];
  const parameterizedValues = [];

  for (let i = 0; i < geographies.length; ++i) {
    const { geolevel, geocode } = geographies[i];
    parameterizedValues.push(geocode);

    whereClauses.push(
      `${geolevel.toLowerCase()}_code = $${parameterizedValues.length}`
    );
  }

  return { whereClauses, parameterizedValues };
};

const getTmcsForGeographies = async ({ year, geographies }) => {
  const geosArr = (Array.isArray(geographies)
    ? geographies
    : [geographies]
  ).filter(g => g);

  if (!geosArr.length) {
    return [];
  }

  const {
    whereClauses,
    parameterizedValues
  } = getTmcsForGeographiesQueryCriteria(geosArr);

  const sql = `
    SELECT tmc
      FROM tmc_metadata_${year}
      WHERE (
        ${whereClauses.map(c => `(${c})`).join(' AND ')}
      )
  `;

  const { rows } = await query(sql, parameterizedValues);

  return rows.map(({ tmc }) => tmc);
};

module.exports = {
  getGeographyAttributes,
  getTmcsForGeographies
};
