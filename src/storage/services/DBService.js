/* eslint global-require: 0 */

const { Pool } = require('pg');

const extractRequiredRelations = require('../../utils/extractRequiredRelations');
const { uniq } = require('../../utils/SetUtils');

if (!process.env.PGDATABASE) {
  require('../../loadEnvFile');
}

const sqlLog = [];

const pool = new Pool({ max: process.env.CALCULATOR_CONCURRENCY || 10 });

const QUERY_BREAK = `;
`;

const query = (a, b, c) => {
  if (typeof a === 'string') {
    sqlLog.push(a);
  } else if (a.text) {
    sqlLog.push(a.text);
  } else {
    throw new Error('ERROR: Failed to log SQL query');
  }
  return pool.query(a, b, c);
};

const getDatabaseQueryRelationDependencies = async () => {
  const referencedRelations = extractRequiredRelations(
    uniq(sqlLog).join(QUERY_BREAK)
  );

  const sql = `select relation_dependencies_fn($1::JSON) AS dependencies;`;

  const {
    rows: [{ dependencies }]
  } = await query(sql, [JSON.stringify(referencedRelations)]);

  return dependencies;
};

const end = () => {
  pool.end();
};

module.exports = {
  query,
  end,
  getDatabaseQueryRelationDependencies
};
