const { getYearNpmrdsCountsByTimePeriod } = require('../DAOs/NpmrdsDataDAO');
const { getNumEpochsPerTimePeriodForYear } = require('../utils/TimeUtils');

const calculateForTmc = async ({ year, tmc, state }) => {
  const counts = await getYearNpmrdsCountsByTimePeriod({
    year,
    tmc,
    state,
    column: 'travel_time_all_vehicles'
  });

  const numEpochsPerTimePeriod = getNumEpochsPerTimePeriodForYear(year);

  return counts.reduce((acc, { timeperiod, ct }) => {
    acc[timeperiod] = ct / numEpochsPerTimePeriod[timeperiod];
    return acc;
  }, {});
};

module.exports = { calculateForTmc };
