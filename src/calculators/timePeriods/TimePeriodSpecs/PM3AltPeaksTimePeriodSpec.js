const { AMP, PMP } = require('../../../enums/pm3TimePeriods');

module.exports = {
  [AMP]: {
    hours: [6, 10],
    dow: [1, 2, 3, 4, 5]
  },
  [PMP]: {
    hours: [15, 19],
    dow: [1, 2, 3, 4, 5]
  }
};
