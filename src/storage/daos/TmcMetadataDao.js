/* eslint no-await-in-loop: 0, no-console: 0 */
const _ = require('lodash');

const { query } = require('../services/DBService');

const { FREEWAY, NONFREEWAY } = require('../../enums/functionalClasses');

const {
  getRisBasedAadtViewForNpmrdsYear,
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
  'isprimary',
];

const buildDirAadtClause = (aadtExpr) =>
  `(${aadtExpr}::DOUBLE PRECISION / LEAST(COALESCE(faciltype,  2), 2)::DOUBLE PRECISION)::DOUBLE PRECISION`;

/*
  From National Performance Measures for Congestion, Reliability, and Freight, and CMAQ Traffic Congestion
    General Guidance and Step-by-Step Metric Calculation Procedures (June 2018)

    To determine which of the 16 traffic distribution profiles should be assigned to
    each reporting segment, the following guidance is provided:
    • Functional Class. Assign based on f_system in NPMRDS segment attributes
      file):
      – Freeway. f_system=1 or 2.
      – Nonfreeway. f_system=3, 4, 5, 6, or 7.
*/
const functionalClass = `(CASE WHEN f_system <= 2 THEN '${FREEWAY}' ELSE '${NONFREEWAY}' END)`;

const aadtTruck = `(COALESCE(aadt_combi, 0) + COALESCE(aadt_singl, 0))`;
const aadtPass = `(aadt - ${aadtTruck})`;

const directionalAadt = buildDirAadtClause('aadt');
const directionalAadtSingl = buildDirAadtClause('aadt_singl');
const directionalAadtCombi = buildDirAadtClause('aadt_combi');
const directionalAadtTruck = buildDirAadtClause(aadtTruck);
const directionalAadtPass = buildDirAadtClause(aadtPass);

// const avgVehicleOccupancyPass = 1.55;
// const avgVehicleOccupancySingl = 10.25;
// const avgVehicleOccupancyCombi = 1.11;

// From FHWA AVO Guidance Document: https://www.fhwa.dot.gov/tpm/guidance/avo_factors.pdf
const avgVehicleOccupancyPass = 1.7;
const avgVehicleOccupancySingl = `(CASE ua_code WHEN '63217' THEN 16.8::DOUBLE PRECISION ELSE 10.7::DOUBLE PRECISION END)`;
const avgVehicleOccupancyCombi = 1;

const avgVehicleOccupancy = `(
  (
    (${avgVehicleOccupancyPass} * ${aadtPass})
    + (${avgVehicleOccupancySingl} * COALESCE(aadt_singl, 0))
    + (${avgVehicleOccupancyCombi} * COALESCE(aadt_combi, 0))
  ) / NULLIF(aadt, 0)
)::DOUBLE PRECISION`;

const avgVehicleOccupancyTruck = `(
  (
    (${avgVehicleOccupancySingl} * COALESCE(aadt_singl, 0))
    + (${avgVehicleOccupancyCombi} * COALESCE(aadt_combi, 0))
  ) / NULLIF(COALESCE(aadt_singl, 0) + COALESCE(aadt_combi, 0), 0)
)::DOUBLE PRECISION`;

// WARNING: changes to this function may require changes to getMetadataForTmcs
const toRisBasedAadt = (str) => {
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
    avgVehicleOccupancyTruckRis: toRisBasedAadt(avgVehicleOccupancyTruck),
  },
);

const tmcMetadataFields = Object.keys(alias2DbColsMappings);

const getMetadataForTmcs = async ({ year, tmcs, columns }) => {
  const tmcsArr = Array.isArray(tmcs) ? tmcs.slice() : [tmcs];

  const requestedCols = (Array.isArray(columns) ? columns : [columns])
    .filter((c) => c)
    .sort();

  // We always need the Primary Key
  requestedCols.push('tmc');

  // Do we neet RIS cols?
  const requestedRisCols = columns.filter((col) => col.match(/ris/i));
  const risMetadataRequested = requestedRisCols.length;

  // WARNING: Extremely brittle. Make sure to update if any changes to toRisBasedAadt
  const risColsToNpmrdsShpCols = requestedRisCols.reduce((acc, col) => {
    acc[col] = col.replace(/(_)?ris/gi, '');
    return acc;
  }, {});

  // If we need ris cols, also request the no-ris cols
  //   so we can backfill in case the conflation failed for the TMC.
  const requiredCols = _.uniq(
    Array.prototype.concat(requestedCols, _.values(risColsToNpmrdsShpCols)),
  );

  const selectClauseElems = [...requiredCols].map((col) => {
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

    // Backfill missing RIS cols with NPMRDS Shapefile cols
    for (let i = 0; i < requestedRisCols.length; ++i) {
      const risCol = requestedRisCols[i];
      const npmrdsShpCol = risColsToNpmrdsShpCols[risCol];

      for (let j = 0; j < rows.length; ++j) {
        const row = rows[j];

        if (_.isNil(row[risCol])) {
          // console.warn(
          // `WARNING: Backfilling ${risCol} with ${npmrdsShpCol} for ${row.tmc}`
          // );
          row[risCol] = row[npmrdsShpCol];
        }
      }
    }

    result.push(...rows);
  }

  return result;
};

module.exports = {
  tmcMetadataFields,
  getMetadataForTmcs,
};
