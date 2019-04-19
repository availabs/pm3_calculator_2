const {
  buildTimeBinNum2HourTable,
  buildDate2DowTableForYear
} = require('./TimeUtils');

class NpmrdsDataEnricher {
  static enrichData({ year, timeBinSize, data }) {
    const timeBinNum2Hour = buildTimeBinNum2HourTable(timeBinSize);
    const date2Dow = buildDate2DowTableForYear(year);

    for (let i = 0; i < data.length; ++i) {
      const row = data[i];
      const { date, timeBinNum } = row;

      row.hour = timeBinNum2Hour[timeBinNum];
      row.dow = date2Dow[date];
    }
  }
}

module.exports = NpmrdsDataEnricher;
