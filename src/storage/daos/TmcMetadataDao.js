/* eslint no-await-in-loop: 0 */
const { camelCase } = require('lodash');

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
  'ris_aadt',
  'ris_aadt_singl',
  'ris_aadt_combi',
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
  'avg_vehicle_occupancy',
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

const avgVehicleOccupancyPass = 1.55;
const avgVehicleOccupancySingl = 10.25;
const avgVehicleOccupancyCombi = 1.11;

const avgVehicleOccupancyTruck = `(
  (
    (${avgVehicleOccupancySingl} * aadt_singl)
    + (${avgVehicleOccupancyCombi} * aadt_combi)
  ) / NULLIF(aadt_singl + aadt_combi, 0)
)`;

const toRisBased = str => {
  return str
    .replace(/\baadt\b/g, 'ris_aadt')
    .replace(/aadt_/g, 'ris_aadt_')
    .replace(/Aadt/, 'RisAadt');
};

const alias2DbColsMappings = tmcMetadataTableColumnNames.reduce(
  (acc, col) => {
    acc[camelCase(col)] = col;
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

    // avgVehicleOccupancy comes from tmc_metadata table
    avgVehicleOccupancyPass,
    avgVehicleOccupancySingl,
    avgVehicleOccupancyCombi,
    avgVehicleOccupancyTruck,

    risAadtTruck: toRisBased(aadtTruck),
    risAadtPass: toRisBased(aadtPass),
    directionalRisAadt: toRisBased(directionalAadt),
    directionalRisAadtSingl: toRisBased(directionalAadtSingl),
    directionalRisAadtCombi: toRisBased(directionalAadtCombi),
    directionalRisAadtTruck: toRisBased(directionalAadtTruck),
    directionalRisAadtPass: toRisBased(directionalAadtPass),

    avgVehicleOccupancyRis: `(
      (
        (${avgVehicleOccupancyPass} * ${toRisBased(aadtPass)})
        + (${avgVehicleOccupancySingl} * ris_aadt_singl)
        + (${avgVehicleOccupancyCombi} * ris_aadt_combi)
      ) / NULLIF(ris_aadt, 0)
    )::DOUBLE PRECISION`,

    avgVehicleOccupancyPassRis: avgVehicleOccupancyPass,
    avgVehicleOccupancySinglRis: avgVehicleOccupancySingl,
    avgVehicleOccupancyCombiRis: avgVehicleOccupancyCombi,
    avgVehicleOccupancyTruckRis: toRisBased(avgVehicleOccupancyTruck)
  }
);

const tmcMetadataFields = Object.keys(alias2DbColsMappings);

const getMetadataForTmcs = async ({ year, tmcs, columns }) => {
  const tmcsArr = Array.isArray(tmcs) ? tmcs.slice() : [tmcs];

  const colAliases = new Set(
    (Array.isArray(columns) ? columns : [columns]).filter(c => c).sort()
  );

  colAliases.add('tmc');

  const selectClauseElems = [...colAliases].map(
    col => `${alias2DbColsMappings[col]} AS "${col}"`
  );

  const risMetadataRequested = columns.some(col => col.match(/ris/i));

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

    result.push(...rows);
  }

  return result;
};

module.exports = {
  tmcMetadataFields,
  getMetadataForTmcs
};
