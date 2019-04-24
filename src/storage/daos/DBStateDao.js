/* eslint no-await-in-loop: 0 */

const {
  connectionInfo,
  getDatabaseQueryRelationDependencies
} = require('../services/DBService');

const getReferencedDatabaseTables = getDatabaseQueryRelationDependencies;

module.exports = {
  connectionInfo,
  getReferencedDatabaseTables
};
