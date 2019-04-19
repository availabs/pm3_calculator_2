const { range } = require('lodash');
const { TOTAL } = require('../../../enums/altTimePeriods');

module.exports = {
  [TOTAL]: {
    hours: [0, 24],
    dow: range(7)
  }
};
