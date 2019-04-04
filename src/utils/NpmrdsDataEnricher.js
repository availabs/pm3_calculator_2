const { binNum2Hour, date2Dow } = require('./TimeUtils');

class NpmrdsDataEnricher {
  static enrichData(data) {
    for (let i = 0; i < data.length; ++i) {
      const row = data[i];
      const { date, timebin_num } = row;

      row.hour = binNum2Hour[timebin_num];
      row.dow = date2Dow[date];
    }
  }
}

module.exports = NpmrdsDataEnricher;
