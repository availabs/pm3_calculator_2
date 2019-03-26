const { Pool } = require('pg');

/* eslint global-require: 0 */

if (!process.env.PGDATABASE) {
  require('./loadEnvFile');
}

const pool = new Pool({ max: 20 });

const query = (a, b, c) => pool.query(a, b, c);

const end = () => pool.end();

module.exports = {
  query,
  end
};
