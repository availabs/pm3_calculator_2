/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getDieselVOCPerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  if (speed_mph <= 5) {
    return (
      speed_mph ** 3 * -0.000266667 +
      speed_mph ** 2 * 0.0032 +
      speed_mph ** 1 * -0.669533333 +
      5.263
    );
  }

  if (speed_mph <= 10) {
    return speed_mph * -0.1812 + 2.8684;
  }

  if (speed_mph <= 15) {
    return speed_mph * -0.0605 + 1.6613;
  }

  return (
    speed_mph ** 8 * -1.71287e-13 +
    speed_mph ** 7 * 5.80467e-11 +
    speed_mph ** 6 * -8.16737e-9 +
    speed_mph ** 5 * 6.13154e-7 +
    speed_mph ** 4 * -2.6007e-5 +
    speed_mph ** 3 * 0.000585236 +
    speed_mph ** 2 * -0.004367529 +
    speed_mph ** 1 * -0.078028096 +
    1.878006101
  );
};

module.exports = getDieselVOCPerVMT;
