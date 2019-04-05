const throwCollisionError = (tps1, tps2, dow, hr) => {
  throw new Error(
    `ERROR: time period spec collision between timePeriods ${tps1} and ${tps2} for dow ${dow} and hour ${hr}`
  );
};

const buildTimePeriodLookupTable = timePeriodSpecDef =>
  Object.keys(timePeriodSpecDef).reduce((acc, timePeriod) => {
    const { hours: [startHr, endHr] = [], dow: daysOfWeek } = timePeriodSpecDef[
      timePeriod
    ];

    for (let i = 0; i < daysOfWeek.length; ++i) {
      const dow = daysOfWeek[i];

      acc[dow] = acc[dow] || {};

      if (startHr <= endHr) {
        for (let hr = startHr; hr < endHr; ++hr) {
          if (acc[dow][hr]) {
            throwCollisionError(acc[dow][hr], timePeriod, dow, hr);
          }
          acc[dow][hr] = timePeriod;
        }
      } else {
        for (let hr = startHr; hr < 24; ++hr) {
          if (acc[dow][hr]) {
            throwCollisionError(acc[dow][hr], timePeriod, dow, hr);
          }
          acc[dow][hr] = timePeriod;
        }
        for (let hr = 0; hr < endHr; ++hr) {
          if (acc[dow][hr]) {
            throwCollisionError(acc[dow][hr], timePeriod, dow, hr);
          }
          acc[dow][hr] = timePeriod;
        }
      }
    }

    return acc;
  }, {});

const timePeriodGetter = timePeriodLookup => ({ dow, hour }) =>
  (timePeriodLookup[dow] && timePeriodLookup[dow][hour]) || null;

const createTimePeriodIdentifier = timePeriodSpecDef => {
  const timePeriodLookup = buildTimePeriodLookupTable(timePeriodSpecDef);

  return timePeriodGetter(timePeriodLookup);
};

module.exports = createTimePeriodIdentifier;
