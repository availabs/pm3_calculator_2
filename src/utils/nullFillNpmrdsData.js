/* eslint no-param-reassign: 0, no-return-assign: 0, no-continue: 0 */

const {
  getDaylightSavingsStartDateForYear,
  getNumDaysPerMonthInYear
} = require('./TimeUtils');

const EPOCHS_PER_DAY = 288;

const nullFillNpmrdsData = ({ data, year, columns = [] }) => {
  const { date: dlsStartDate } = getDaylightSavingsStartDateForYear(year);
  const numDaysPerMonth = getNumDaysPerMonthInYear(year);

  const fillData = columns.reduce((acc, col) => {
    acc[col] = null;
    return acc;
  }, {});

  const filledData = [];

  let cursor = 0;

  for (let m = 1; m <= 12; ++m) {
    let potentialDLS = m !== 3;
    const numDays = numDaysPerMonth[m - 1];
    const mm = `0${m}`.slice(-2);

    for (let d = 1; d <= numDays; ++d) {
      potentialDLS = potentialDLS && d === dlsStartDate;

      const dd = `0${d}`.slice(-2);
      const fillDate = `${year}-${mm}-${dd}`;

      for (let e = 0; e < EPOCHS_PER_DAY; ++e) {
        const { date, epoch } = data[cursor] || {};

        if (fillDate === date && e === epoch) {
          filledData.push(data[cursor++]);
        } else if (potentialDLS && epoch >= 24 && epoch < 36) {
          continue;
        } else {
          filledData.push(
            Object.assign({}, fillData, { date: fillDate, epoch: e })
          );
        }
      }
    }
  }

  return filledData;
};

module.exports = nullFillNpmrdsData;
