/* eslint no-await-in-loop: 0, no-console: 0 */
const _ = require('lodash');

const { query } = require('../services/DBService');

const { FREEWAY, NONFREEWAY } = require('../../enums/functionalClasses');

const {
  getRisBasedAadtViewForNpmrdsYear
} = require('../../utils/getRisBasedAadtForTmcsMetadata');

const TMC_SUBSET_SIZE = 1000;

const tmcMetadataTableColumnNames = [
  'tmc',
  'tmctype',
  'roadnumber',
  'roadname',
  'firstname',
  'tmclinear',
  'country',
  'state_name',
  'county_name',
  'zip',
  'direction',
  'startlat',
  'startlong',
  'endlat',
  'endlong',
  'miles',
  'frc',
  'border_set',
  'f_system',
  'urban_code',
  'faciltype',
  'structype',
  'thrulanes',
  'route_numb',
  'route_sign',
  'route_qual',
  'altrtename',
  'aadt',
  'aadt_singl',
  'aadt_combi',
  'aadt_ris',
  'aadt_singl_ris',
  'aadt_combi_ris',
  'nhs',
  'nhs_pct',
  'strhnt_typ',
  'strhnt_pct',
  'truck',
  'state',
  'is_interstate',
  'is_controlled_access',
  'avg_speedlimit',
  'mpo_code',
  'mpo_acrony',
  'mpo_name',
  'ua_code',
  'ua_name',
  'congestion_level',
  'directionality',
  'bounding_box',
  // 'avg_vehicle_occupancy'
  'state_code',
  'county_code',
  'isprimary'
];

const buildDirAadtClause = aadtExpr =>
  `(${aadtExpr}::NUMERIC / LEAST(COALESCE(faciltype,  2), 2)::NUMERIC)::DOUBLE PRECISION`;

const functionalClass = `(CASE WHEN f_system <= 2 THEN '${FREEWAY}' ELSE '${NONFREEWAY}' END)`;

const aadtTruck = `(aadt_combi + aadt_singl)`;
const aadtPass = `(aadt - ${aadtTruck})`;

const directionalAadt = buildDirAadtClause('aadt');
const directionalAadtSingl = buildDirAadtClause('aadt_singl');
const directionalAadtCombi = buildDirAadtClause('aadt_combi');
const directionalAadtTruck = buildDirAadtClause(aadtTruck);
const directionalAadtPass = buildDirAadtClause(aadtPass);

// const avgVehicleOccupancyPass = 1.55;
// const avgVehicleOccupancySingl = 10.25;
// const avgVehicleOccupancyCombi = 1.11;

// From Keith Miller Spreadsheet
const avgVehicleOccupancyPass = 1.7;
// const avgVehicleOccupancySingl = 16.8;
const avgVehicleOccupancySingl = `(CASE ua_code WHEN '63217' THEN 16.8::NUMERIC ELSE 10.7::NUMERIC END)`;
const avgVehicleOccupancyCombi = 1;

const avgVehicleOccupancy = `(
  (
    (${avgVehicleOccupancyPass} * ${aadtPass})
    + (${avgVehicleOccupancySingl} * aadt_singl)
    + (${avgVehicleOccupancyCombi} * aadt_combi)
  ) / NULLIF(aadt, 0)
)::DOUBLE PRECISION`;

const avgVehicleOccupancyTruck = `(
  (
    (${avgVehicleOccupancySingl} * aadt_singl)
    + (${avgVehicleOccupancyCombi} * aadt_combi)
  ) / NULLIF(aadt_singl + aadt_combi, 0)
)::DOUBLE PRECISION`;

// WARNING: changes to this function may require changes to getMetadataForTmcs
const toRisBasedAadt = str => {
  return str
    .replace(/aadt\b/g, 'aadt_ris')
    .replace(/aadt_singl/g, 'aadt_singl_ris')
    .replace(/aadt_combi/g, 'aadt_combi_ris')
    .replace(/Aadt\b/, 'AadtRis')
    .replace(/AadtSingl/, 'AadtSinglRis')
    .replace(/AadtCombi/, 'AadtCombiRis');
};

const alias2DbColsMappings = tmcMetadataTableColumnNames.reduce(
  (acc, col) => {
    acc[_.camelCase(col)] = col;
    return acc;
  },
  {
    functionalClass,

    aadtTruck,
    aadtPass,
    directionalAadt,
    directionalAadtSingl,
    directionalAadtCombi,
    directionalAadtTruck,
    directionalAadtPass,

    avgVehicleOccupancy,
    avgVehicleOccupancyPass,
    avgVehicleOccupancySingl,
    avgVehicleOccupancyCombi,
    avgVehicleOccupancyTruck,

    aadtTruckRis: toRisBasedAadt(aadtTruck),
    aadtPassRis: toRisBasedAadt(aadtPass),
    directionalAadtRis: toRisBasedAadt(directionalAadt),
    directionalAadtSinglRis: toRisBasedAadt(directionalAadtSingl),
    directionalAadtCombiRis: toRisBasedAadt(directionalAadtCombi),
    directionalAadtTruckRis: toRisBasedAadt(directionalAadtTruck),
    directionalAadtPassRis: toRisBasedAadt(directionalAadtPass),

    avgVehicleOccupancyRis: toRisBasedAadt(avgVehicleOccupancy),
    avgVehicleOccupancyPassRis: avgVehicleOccupancyPass,
    avgVehicleOccupancySinglRis: toRisBasedAadt(avgVehicleOccupancySingl),
    avgVehicleOccupancyCombiRis: avgVehicleOccupancyCombi,
    avgVehicleOccupancyTruckRis: toRisBasedAadt(avgVehicleOccupancyTruck)
  }
);

const tmcMetadataFields = Object.keys(alias2DbColsMappings);

const getMetadataForTmcs = async ({ year, tmcs, columns }) => {
  const tmcsArr = Array.isArray(tmcs) ? tmcs.slice() : [tmcs];

  const requestedCols = (Array.isArray(columns) ? columns : [columns])
    .filter(c => c)
    .sort();

  // We always need the Primary Key
  requestedCols.push('tmc');

  // Do we neet RIS cols?
  const requestedRisCols = columns.filter(col => col.match(/ris/i));
  const risMetadataRequested = requestedRisCols.length;

  // WARNING: Extremely brittle. Make sure to update if any changes to toRisBasedAadt
  const risColsToRitisCols = requestedRisCols.reduce((acc, col) => {
    acc[col] = col.replace(/(_)?ris/gi, '');
    return acc;
  }, {});

  // If we need ris cols, also request the no-ris cols
  //   so we can backfill in case the conflation failed for the TMC.
  const requiredCols = _.uniq(
    Array.prototype.concat(requestedCols, _.values(risColsToRitisCols))
  );

  const selectClauseElems = [...requiredCols].map(col => {
    const alias = alias2DbColsMappings[col];

    if (!alias) {
      throw new Error(`Unrecognized tmc metadata column: ${col}`);
    }

    return `${alias} AS "${col}"`;
  });

  const risBasedAadtView = risMetadataRequested
    ? await getRisBasedAadtViewForNpmrdsYear(year)
    : null;

  const risJoinClause = risMetadataRequested
    ? `LEFT OUTER JOIN ${risBasedAadtView} USING (tmc)`
    : '';

  const sql = `
    SELECT ${selectClauseElems}
      FROM tmc_metadata_${year}
        ${risJoinClause}
      WHERE (
        tmc = ANY($1)
      )
  `;

  const result = [];

  while (tmcsArr.length) {
    const tmcSubset = tmcsArr.splice(0, TMC_SUBSET_SIZE);

    const { rows } = await query(sql, [tmcSubset]);

    // Backfill missing RIS cols with RITIS cols
    for (let i = 0; i < requestedRisCols.length; ++i) {
      const risCol = requestedRisCols[i];
      const ritisCol = risColsToRitisCols[risCol];

      for (let j = 0; j < rows.length; ++j) {
        const row = rows[j];

        if (_.isNil(row[risCol])) {
          console.warn(
            `WARNING: Backfilling ${risCol} with ${ritisCol} for ${row.tmc}`
          );
          row[risCol] = row[ritisCol];
        }
      }
    }

    result.push(...rows);
  }

  return result;
};

module.exports = {
  tmcMetadataFields,
  getMetadataForTmcs
};
