const _ = require('lodash');
const memoizeOne = require('memoize-one');

const { query } = require('../storage/services/DBService');

const getRisBasedAadtForTmcsMetadata = memoizeOne(async () => {
  const sql = `
    SELECT
        "conflationMapVersion",
        "risYears"
      FROM (
        SELECT
            REGEXP_REPLACE(
              matviewname,
              '^conflation_map_v|_ris_based_aadt_\\d{4}$',
              '',
              'g'
            ) AS "conflationMapVersion",
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
            ( matviewname ~ '^conflation_map_v\\d{1,}_\\d{1,}_\\d{1,}_ris_based_aadt_\\d{4}$' )
          )
          GROUP BY 1
      ) AS t
      ORDER BY
          ( string_to_array("conflationMapVersion", '_') )[1]::INTEGER DESC,
          ( string_to_array("conflationMapVersion", '_') )[2]::INTEGER DESC,
          ( string_to_array("conflationMapVersion", '_') )[3]::INTEGER DESC
      LIMIT 1
    ;
  `;

  const { rows } = await query(sql);

  return _.isEmpty(rows) ? null : rows[0];
});

const getRisBasedAadtYearForNpmrdsYear = memoizeOne(async npmrdsYear => {
  const risAadtForTmcsMetadata = await getRisBasedAadtForTmcsMetadata();

  if (risAadtForTmcsMetadata === null) {
    return null;
  }

  const { risYears } = risAadtForTmcsMetadata;

  const risYear = Math.max(...risYears.filter(yr => yr <= npmrdsYear));

  return Number.isFinite(risYear) ? risYear : Math.min(...risYears);
});

const getRisBasedAadtViewForNpmrdsYear = memoizeOne(async npmrdsYear => {
  const metadata = await getRisBasedAadtForTmcsMetadata();

  if (metadata === null) {
    return null;
  }

  const { conflationMapVersion } = metadata;

  const risAadtYear = await getRisBasedAadtYearForNpmrdsYear(npmrdsYear);

  const viewName = `conflation.conflation_map_v${conflationMapVersion}_ris_based_aadt_${risAadtYear}`;

  return viewName;
});

module.exports = {
  getRisBasedAadtForTmcsMetadata,
  getRisBasedAadtYearForNpmrdsYear,
  getRisBasedAadtViewForNpmrdsYear
};
