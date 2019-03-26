// This belongs as a sub class of the NPMRDSProcessor.

const memoizeOne = require('memoize-one');

const { AMP, MIDD, PMP, WE, OVN } = require('../constants/pm3TimeBins');

const EPOCHS_PER_DAY = 288;

const hourOfBinNum = (binMinutes, binNum) =>
  Math.floor((binMinutes * binNum) / 60);

const minuteOfBinNum = (binMinutes, binNum) => (binMinutes * binNum) % 60;

const binNumToTime = (binMinutes, binNum) => {
  const hour = hourOfBinNum(binMinutes, binNum);
  const minutes = minuteOfBinNum(binMinutes, binNum);

  const HH = `0${hour}`.slice(-2);
  const MM = `0${minutes}`.slice(-2);

  return `${HH}:${MM}`;
};

const numBinsInDay = binMinutes =>
  Math.floor((5 / binMinutes) * EPOCHS_PER_DAY);

const timesOfDayForBins = binMinutes => {
  const numBins = numBinsInDay(binMinutes);
  const timesOfDay = [];
  for (let i = 0; i < numBins; ++i) {
    timesOfDay.push(binNumToTime(binMinutes, i));
  }
  return timesOfDay;
};

const daysInRange = (startDate, endDate) => {
  const cur = new Date(`${startDate} 12:00:00`);
  const end = new Date(`${endDate} 12:00:00`);

  const days = [];
  while (cur <= end) {
    const yyyy = cur.getFullYear();
    const mm = `0${cur.getMonth() + 1}`.slice(-2);
    const dd = `0${cur.getDate()}`.slice(-2);
    days.push(`${yyyy}-${mm}-${dd}`);
    cur.setDate(cur.getDate() + 1);
  }

  return days;
};

const getDateString = (year, month, date) => {
  const mm = `0${month}`.slice(-2);
  const dd = `0${date}`.slice(-2);
  return `${year}-${mm}-${dd}`;
};

const getTimestampsForDateRange = (startDate, endDate, binMinutes) => {
  const days = daysInRange(startDate, endDate);
  const times = timesOfDayForBins(binMinutes);

  const timestamps = new Array(days.length * times.length);

  for (let i = 0; i < days.length; ++i) {
    for (let j = 0; j < times.length; ++j) {
      timestamps[i * times.length + j] = `${days[i]} ${times[j]}`;
    }
  }

  return timestamps;
};

const getDaylightSavingsStartDateForYear = year => {
  return {
    year,
    month: 3,
    date: 14 - new Date(`${year}/03/07`).getDay()
  };
};

const getNumDaysPerMonthInYear = year => {
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

  // https://stackoverflow.com/a/725111
  return [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
};

const getNumEpochsPerTimePeriodForYear = memoizeOne(year => {
  const numDaysPerMonth = getNumDaysPerMonthInYear(year);

  let dow = new Date(`${year}-01-01T12:00:00`).getDay();

  let amp = 0;
  let midd = 0;
  let pmp = 0;
  let we = 0;
  let ovn = 0;

  for (let m = 1; m <= 12; ++m) {
    for (let d = 1; d <= numDaysPerMonth[m - 1]; ++d) {
      ovn += 12 * 10;
      if (dow % 6) {
        amp += 12 * 4;
        midd += 12 * 6;
        pmp += 12 * 4;
      } else {
        we += 12 * 14;
      }

      dow = (dow + 1) % 7;
    }
  }

  // remove an hour of epochs for the beginning of daylight savings
  ovn -= 12;

  return {
    [AMP]: amp,
    [MIDD]: midd,
    [PMP]: pmp,
    [WE]: we,
    [OVN]: ovn
  };
});

module.exports = {
  hourOfBinNum,
  minuteOfBinNum,
  binNumToTime,
  numBinsInDay,
  timesOfDayForBins,
  daysInRange,
  getDateString,
  getTimestampsForDateRange,
  getDaylightSavingsStartDateForYear,
  getNumDaysPerMonthInYear,
  getNumEpochsPerTimePeriodForYear
};
