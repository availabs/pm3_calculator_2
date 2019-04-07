const {
  buildTimeBinNum2HourTable,
  buildDate2DowTableForYear
} = require('./TimeUtils');

class NpmrdsDataEnricher {
  static enrichData({ year, timeBinSize, data }) {
    const binNum2Hour = buildTimeBinNum2HourTable(timeBinSize);
    const date2Dow = buildDate2DowTableForYear(year);

    for (let i = 0; i < data.length; ++i) {
      const row = data[i];
      const { date, timebin_num } = row;

      row.hour = binNum2Hour[timebin_num];
      row.dow = date2Dow[date];
    }
  }
}

module.exports = NpmrdsDataEnricher;
