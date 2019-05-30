const { AM_OFF, PM_OFF, WE } = require('../../../enums/freeflowTimePeriods');

module.exports = {
  [AM_OFF]: {
    hours: [9, 16],
    dow: [1, 2, 3, 4, 5]
  },
  [PM_OFF]: {
    hours: [19, 22],
    dow: [1, 2, 3, 4, 5]
  },
  [WE]: {
    hours: [6, 22],
    dow: [0, 6]
  }
};
