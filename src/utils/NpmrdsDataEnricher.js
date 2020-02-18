const assert = require('assert');
const {
  buildTimeBinNum2HourTable,
  buildDate2DowTableForYear
} = require('./TimeUtils');

class NpmrdsDataEnricher {
  static enrichData({ year, timeBinSize, data }) {
    if (!Array.isArray(data)) {
      return;
    }

    const timeBinNum2Hour = buildTimeBinNum2HourTable(timeBinSize);
    const date2Dow = buildDate2DowTableForYear(year);

    for (let i = 0; i < data.length; ++i) {
      const row = data[i];
      const { date, timeBinNum } = row;

      row.hour = timeBinNum2Hour[timeBinNum];
      assert(row.hour >= 0 && row.hour <= 23);

      row.dow = date2Dow[date];
      assert(row.dow >= 0 && row.dow <= 6);

      row.month = +date.split('-')[1];
      assert(row.month >= 1 && row.month <= 12);
    }
  }
}

module.exports = NpmrdsDataEnricher;
