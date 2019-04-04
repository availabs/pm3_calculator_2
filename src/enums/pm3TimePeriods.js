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

module.exports = {
  AMP: 'AMP',
  MIDD: 'MIDD',
  PMP: 'PMP',
  WE: 'WE',
  OVN: 'OVN'
};
