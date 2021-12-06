/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getGasolineCOPerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  if (speed_mph <= 5) {
    return (
      speed_mph ** 4 * -1.786130141 +
      speed_mph ** 3 * 25.89908704 +
      speed_mph ** 2 * -137.5339208 +
      2313.723479
    );
  }

  if (speed_mph <= 10) {
    return speed_mph * -79.1132 + 1391.9958;
  }

  if (speed_mph <= 15) {
    return speed_mph * -25.4105 + 854.9693;
  }

  return (
    speed_mph ** 5 * -7.07889e-7 +
    speed_mph ** 4 * 0.000255182 +
    speed_mph ** 3 * -0.032716074 +
    speed_mph ** 2 * 1.984300836 +
    speed_mph * -59.56931737 +
    1025.122694
  );
};

module.exports = getGasolineCOPerVMT;
