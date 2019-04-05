/* eslint no-continue: 0 */

const { year, timeBinSize } = require('../calculatorSettings');

const EPOCHS_PER_DAY = 288;

const numBinsInDay = Math.floor((5 / timeBinSize) * EPOCHS_PER_DAY);

const binNum2Hour = [...new Array(numBinsInDay)].map((_, binNum) =>
  Math.floor((timeBinSize * binNum) / 60)
);

const getDaylightSavingsStartDateForYear = () => ({
  year,
  month: 3,
  date: 14 - new Date(`${year}/03/07`).getDay()
});

const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

const numDaysPerMonth = [
  31,
  isLeapYear ? 29 : 28,
  31,
  30,
  31,
  30,
  31,
  31,
  30,
  31,
  30,
  31
];

const date2Dow = Object.freeze(
  (() => {
    const d2d = {};

    let dow = new Date(`${year}-01-01T12:00:00`).getDay();

    for (let m = 1; m <= 12; ++m) {
      const mm = `0${m}`.slice(-2);
      for (let d = 1; d <= numDaysPerMonth[m - 1]; ++d) {
        const dd = `0${d}`.slice(-2);

        d2d[`${year}-${mm}-${dd}`] = dow;
        dow = (dow + 1) % 7;
      }
    }

    return d2d;
  })()
);

const getNumBinsPerTimePeriodForYear = timePeriodIdentifier => {
  const dlsStart = getDaylightSavingsStartDateForYear(year);

  const counts = {};

  for (let month = 1; month <= 12; ++month) {
    const mm = `0${month}`.slice(-2);

    for (let date = 1; date <= numDaysPerMonth[month - 1]; ++date) {
      const dd = `0${date}`.slice(-2);

      const dow = date2Dow[`${year}-${mm}-${dd}`];

      for (let binNum = 0; binNum < numBinsInDay; ++binNum) {
        const hour = binNum2Hour[binNum];

        if (month === dlsStart.month && date === dlsStart.date && hour === 2) {
          continue;
        }

        const timePeriod = timePeriodIdentifier({ hour, dow });

        if (!timePeriod) {
          continue;
        }

        counts[timePeriod] = counts[timePeriod] || 0;
        ++counts[timePeriod];
      }
    }
  }

  return counts;
};

module.exports = {
  numBinsInDay,
  binNum2Hour,
  date2Dow,
  getNumBinsPerTimePeriodForYear
};
