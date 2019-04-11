const { AMP, PMP } = require('../../../enums/pm3TimePeriods')
const { FREEFLOW } = require('../../../enums/altTimePeriods')

module.exports = {
  [AMP]: {
    hours: [6, 10],
    dow: [1, 2, 3, 4, 5]
  },
  [PMP]: {
    hours: [15, 19],
    dow: [1, 2, 3, 4, 5]
  },
  [FREEFLOW]: {
    hours: [22, 5],
    dow: [0, 1, 2, 3, 4, 5, 6]
  }
};
