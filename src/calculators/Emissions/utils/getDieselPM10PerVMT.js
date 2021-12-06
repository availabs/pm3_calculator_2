/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getDieselPM10PerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  if (speed_mph <= 5) {
    return (
      speed_mph ** 3 * 2.66667e-5 +
      speed_mph ** 2 * -0.00032 +
      speed_mph ** 1 * -0.090246667 +
      0.7118
    );
  }

  if (speed_mph <= 10) {
    return (
      speed_mph ** 3 * 0.001941667 +
      speed_mph ** 2 * -0.045771429 +
      speed_mph ** 1 * 0.33010119 +
      -0.518708571
    );
  }

  if (speed_mph <= 15) {
    return speed_mph * -0.0057 + 0.2045;
  }

  return (
    speed_mph ** 8 * 1.59025e-13 +
    speed_mph ** 7 * -6.08852e-11 +
    speed_mph ** 6 * 9.90172e-9 +
    speed_mph ** 5 * -8.9069e-7 +
    speed_mph ** 4 * 4.83196e-5 +
    speed_mph ** 3 * -0.001614034 +
    speed_mph ** 2 * 0.032361579 +
    speed_mph ** 1 * -0.357979789 +
    1.787962468
  );
};

module.exports = getDieselPM10PerVMT;
