/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getDieselCOPerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  if (speed_mph <= 5) {
    return (
      speed_mph ** 3 * 0.000266667 +
      speed_mph ** 2 * -0.0032 +
      speed_mph ** 1 * -1.886466667 +
      15.773
    );
  }

  if (speed_mph <= 10) {
    return speed_mph * -0.527 + 8.93;
  }

  if (speed_mph <= 15) {
    return speed_mph * -0.1652 + 5.3118;
  }

  return (
    speed_mph ** 8 * 6.6539e-13 +
    speed_mph ** 7 * -2.68016e-10 +
    speed_mph ** 6 * 4.58642e-8 +
    speed_mph ** 5 * -4.34255e-6 +
    speed_mph ** 4 * 0.000248381 +
    speed_mph ** 3 * -0.008793529 +
    speed_mph ** 2 * 0.189498333 +
    speed_mph ** 1 * -2.337921606 +
    15.2459601
  );
};

module.exports = getDieselCOPerVMT;
