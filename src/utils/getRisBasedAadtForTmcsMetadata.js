const _ = require('lodash');
const memoizeOne = require('memoize-one');

const { query } = require('../storage/services/DBService');

const getRisYearsForLatestConflationMapVersion = memoizeOne(async () => {
  const sql = `
    SELECT
        "conflationMapVersion",
        "risYears"
      FROM (
        SELECT
            -- Extract the x_y_z semantic version from the conflation_map_vx_y_x_ris_based_metadata_<year> matviewname
            REGEXP_REPLACE(
              matviewname,
              '^conflation_map_v|_ris_based_metadata_\\d{4}$',
              '',
              'g'
            ) AS "conflationMapVersion",
            -- Extract the year from the the conflation_map_vx_y_x_ris_based_metadata_<year> matviewname
            json_agg(
              (
                regexp_match(
                  matviewname,
                  '\\d{4}$'
                )
              )[1]::INTEGER
            ) AS "risYears"
          FROM pg_catalog.pg_matviews
          WHERE (
            ( schemaname = 'conflation' )
            AND
            ( matviewname ~ '^conflation_map_v\\d{1,}_\\d{1,}_\\d{1,}_ris_based_metadata_\\d{4}$' )
          )
          GROUP BY 1
      ) AS t
      ORDER BY -- descending conflation map version
          ( string_to_array("conflationMapVersion", '_') )[1]::INTEGER DESC,
          ( string_to_array("conflationMapVersion", '_') )[2]::INTEGER DESC,
          ( string_to_array("conflationMapVersion", '_') )[3]::INTEGER DESC
      LIMIT 1  -- only the latest conflation map version
    ;
  `;

  // Result schema:
  //   {
  //     conflationMapVersion: "x_y_z",
  //     risYears: [ years with RIS data ]
  //   }
  const { rows } = await query(sql);

  return _.isEmpty(rows) ? null : rows[0];
});

const getRisBasedAadtYearForNpmrdsYear = memoizeOne(async npmrdsYear => {
  const risAadtForTmcsMetadata = await getRisYearsForLatestConflationMapVersion();

  if (risAadtForTmcsMetadata === null) {
    return null;
  }

  const { risYears } = risAadtForTmcsMetadata;

  const risYear = Math.max(...risYears.filter(yr => yr <= npmrdsYear));

  return Number.isFinite(risYear) ? risYear : Math.min(...risYears);
});

const getRisBasedAadtViewForNpmrdsYear = memoizeOne(async npmrdsYear => {
  const metadata = await getRisYearsForLatestConflationMapVersion();

  if (metadata === null) {
    return null;
  }

  const { conflationMapVersion } = metadata;

  const risAadtYear = await getRisBasedAadtYearForNpmrdsYear(npmrdsYear);

  const viewName = `conflation.conflation_map_v${conflationMapVersion}_ris_based_metadata_${risAadtYear}`;

  return viewName;
});

module.exports = {
  getRisYearsForLatestConflationMapVersion,
  getRisBasedAadtYearForNpmrdsYear,
  getRisBasedAadtViewForNpmrdsYear
};
