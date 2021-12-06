/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getDieselCO2PerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  if (speed_mph <= 5) {
    return (
      speed_mph ** 3 * 0.000266667 +
      speed_mph ** 2 * -0.0032 +
      speed_mph ** 1 * -1338.172467 +
      10482.592
    );
  }

  if (speed_mph <= 10) {
    return speed_mph * -292.5435 + 5254.4008;
  }

  if (speed_mph <= 15) {
    return speed_mph * -75.1704 + 3080.6692;
  }

  return (
    speed_mph ** 8 * 2.67074e-9 +
    speed_mph ** 7 * -1.01958e-6 +
    speed_mph ** 6 * 0.000165527 +
    speed_mph ** 5 * -0.014884945 +
    speed_mph ** 4 * 0.808577495 +
    speed_mph ** 3 * -27.09115942 +
    speed_mph ** 2 * 545.5749265 +
    speed_mph * -6055.844792 +
    30224.61619
  );
};

module.exports = getDieselCO2PerVMT;
