/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getDieselPM2_5PerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  if (speed_mph <= 5) {
    return (
      speed_mph ** 3 * 2.66667e-5 +
      speed_mph ** 2 * -0.00032 +
      speed_mph ** 1 * -0.085646667 +
      0.6756
    );
  }

  if (speed_mph <= 10) {
    return speed_mph * -0.02055 + 0.34548;
  }

  if (speed_mph <= 15) {
    return speed_mph * -0.00543 + 0.19433;
  }

  return (
    speed_mph ** 8 * 1.51102e-13 +
    speed_mph ** 7 * -5.78923e-11 +
    speed_mph ** 6 * 9.42126e-9 +
    speed_mph ** 5 * -8.4799e-7 +
    speed_mph ** 4 * 4.60277e-5 +
    speed_mph ** 3 * -0.001538158 +
    speed_mph ** 2 * 0.030850479 +
    speed_mph * -0.341326255 +
    1.704300144
  );
};

module.exports = getDieselPM2_5PerVMT;
