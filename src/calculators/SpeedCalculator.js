const { TRAVEL_TIME } = require('../enums/npmrdsMetrics');
const getMetricKey = require('./utils/getNpmrdsMetricKey');

class SpeedCalculator {
  constructor({ length, datasource }) {
    this.length = length;
    this.ttKey = getMetricKey({ metric: TRAVEL_TIME, datasource });
  }

  computeSpeed({ [this.ttKey]: tt }) {
    return (tt / this.length) * 3600;
  }
}

module.exports = SpeedCalculator;
