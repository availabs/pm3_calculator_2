const nycTmcs = require('../nyc_tmcs_list_2017.json');

const getRequestedTmcs = async () => nycTmcs;

module.exports = { getRequestedTmcs };
