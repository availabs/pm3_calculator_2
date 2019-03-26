/*
  From FinalRule doc, pg 6006

    These time periods cover 24-hours, broken into
      AM peak (6 a.m. to 10 a.m.),
      mid-day (10 a.m. to 4 p.m.), and 
      PM peak (4 p.m. to 8 p.m.)
        periods for Mondays through Fridays,
      weekends (6 a.m. to 8 p.m.), and
      overnights for all days (8 p.m. to 6 a.m.)
*/

const { AMP, MIDD, PMP, WE, OVN } = require('../constants/pm3TimeBins');

const getPm3TimePeriod = ({ date, epoch, dow, hour }) => {
  const hr = Number.isFinite(hour) ? hour : Math.floor(epoch / 12);

  if (hr < 6 || hr >= 20) {
    return OVN;
  }

  const dayOfWeek = Number.isFinite(dow)
    ? dow
    : new Date(`${date}T12:00:00`).getDay();

  if (!(dayOfWeek % 6)) {
    return WE;
  }

  if (hr >= 6 && hr < 10) {
    return AMP;
  }

  if (hr >= 10 && hr < 16) {
    return MIDD;
  }

  return PMP;
};

module.exports = getPm3TimePeriod;
