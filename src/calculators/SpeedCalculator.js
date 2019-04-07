const { TRAVEL_TIME } = require('../enums/npmrdsMetrics');
const { getMetricKey } = require('../utils/NpmrdsMetricKey');

class SpeedCalculator {
  constructor({ length, dataSource }) {
    this.length = length;
    this.ttKey = getMetricKey({ metric: TRAVEL_TIME, dataSource });
  }

  computeSpeed({ [this.ttKey]: tt }) {
    return (tt / this.length) * 3600;
  }
}

module.exports = SpeedCalculator;
