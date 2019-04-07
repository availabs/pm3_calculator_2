const { TRAVEL_TIME, SPEED } = require('../enums/npmrdsMetrics');
const { ALL, PASS, TRUCK } = require('../enums/npmrdsDataSources');

const prefixes = {
  [TRAVEL_TIME]: 'travel_time',
  [SPEED]: 'speed'
};

const suffixes = {
  [ALL]: 'all_vehicles',
  [PASS]: 'passenger_vehicles',
  [TRUCK]: 'freight_trucks'
};

const getNpmrdsMetricKey = ({ metric, dataSource }) => 
  `${prefixes[metric]}_${suffixes[dataSource]}`;

module.exports = { getNpmrdsMetricKey };
