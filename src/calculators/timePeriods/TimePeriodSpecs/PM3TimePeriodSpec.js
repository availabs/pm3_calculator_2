const { AMP, MIDD, PMP, WE, OVN } = require('../../../enums/pm3TimePeriods');

module.exports = {
  [AMP]: {
    hours: [6, 10],
    dow: [1, 2, 3, 4, 5],
  },
  [MIDD]: {
    hours: [10, 16],
    dow: [1, 2, 3, 4, 5],
  },
  [PMP]: {
    hours: [16, 20],
    dow: [1, 2, 3, 4, 5],
  },
  [WE]: {
    hours: [6, 20],
    dow: [0, 6],
  },
  [OVN]: {
    hours: [20, 6],
    dow: [0, 1, 2, 3, 4, 5, 6],
  },
};
