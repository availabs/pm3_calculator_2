const { getYearNpmrdsDataForTmc } = require('../DAOs/NpmrdsDataDAO');
const { getNumEpochsPerTimePeriodForYear } = require('../utils/TimeUtils');
const getPm3TimePeriod = require('../utils/getPm3TimePeriod');

const columns = ['travel_time_all_vehicles'];

const calculateForTmc = async ({ year, tmc, state }) => {
  const data = await getYearNpmrdsDataForTmc({
    year,
    tmc,
    state,
    columns
  });

  const numEpochsPerTimePeriod = getNumEpochsPerTimePeriodForYear(year);

  const counts = data.reduce((acc, row) => {
    const { travel_time_all_vehicles } = row;
    if (travel_time_all_vehicles !== null) {
      const timeperiod = getPm3TimePeriod(row);
      acc[timeperiod] = acc[timeperiod] || 0;
      ++acc[timeperiod];
    }
    return acc;
  }, {});

  return Object.keys(counts).reduce((acc, timeperiod) => {
    acc[timeperiod] = counts[timeperiod] / numEpochsPerTimePeriod[timeperiod];
    return acc;
  }, {});
};

module.exports = { calculateForTmc };
