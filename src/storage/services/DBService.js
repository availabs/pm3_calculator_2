/* eslint global-require: 0 */

const { Pool } = require('pg');

if (!process.env.PGDATABASE) {
  require('../../loadEnvFile');
}

const pool = new Pool({ max: 20 });

const query = (a, b, c) => pool.query(a, b, c);

const end = () => pool.end();

module.exports = {
  query,
  end
};
