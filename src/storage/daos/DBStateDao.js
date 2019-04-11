/* eslint no-await-in-loop: 0 */

const {
  getDatabaseQueryRelationDependencies
} = require('../services/DBService');

const getReferencedDatabaseTables = getDatabaseQueryRelationDependencies;

module.exports = {
  getReferencedDatabaseTables
};
