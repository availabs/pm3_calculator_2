/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getGasolineCOPerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  if (speed_mph <= 5) {
    return (
      speed_mph ** 4 * -0.008338028 +
      speed_mph ** 3 * 0.120901408 +
      speed_mph ** 2 * -0.642028169 +
      11.64929577
    );
  }

  if (speed_mph <= 10) {
    return speed_mph * -0.371457143 + 7.357428571;
  }

  if (speed_mph <= 15) {
    return speed_mph * -0.120628571 + 4.849190476;
  }

  return (
    speed_mph ** 4 * 0.00000159649120061955 +
    speed_mph ** 3 * -0.000284041235436914 +
    speed_mph ** 2 * 0.0185137829206778 +
    speed_mph * -0.529304763588869 +
    7.81691944721381
  );
};

module.exports = getGasolineCOPerVMT;
