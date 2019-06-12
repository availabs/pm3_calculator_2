// https://ops.fhwa.dot.gov/perf_measurement/ucr/documentation.htm

const { AMP, PMP } = require('../../../enums/pm3TimePeriods');

module.exports = {
  [AMP]: {
    hours: [6, 9],
    dow: [1, 2, 3, 4, 5]
  },
  [PMP]: {
    hours: [16, 19],
    dow: [1, 2, 3, 4, 5]
  }
};
