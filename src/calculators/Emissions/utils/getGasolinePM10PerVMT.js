/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getGasolinePM10PerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  if (speed_mph <= 5) {
    return (
      speed_mph ** 4 * -5.6338e-6 +
      speed_mph ** 3 * 8.16901e-5 +
      speed_mph ** 2 * -0.000433803 +
      0.00915493
    );
  }

  if (speed_mph <= 10) {
    return (
      speed_mph ** 4 * -1.66667e-5 +
      speed_mph ** 3 * 0.000533333 +
      speed_mph ** 2 * -0.006333333 +
      speed_mph * 0.032816667 +
      -0.0578
    );
  }

  if (speed_mph <= 15) {
    return (
      speed_mph ** 4 * 1.66667e-5 +
      speed_mph ** 3 * -0.000866667 +
      speed_mph ** 2 * 0.016833333 +
      speed_mph * -0.144883333 +
      0.47
    );
  }

  return (
    speed_mph ** 8 * -5.92599e-15 +
    speed_mph ** 7 * 2.31631e-12 +
    speed_mph ** 6 * -3.88249e-10 +
    speed_mph ** 5 * 3.63135e-8 +
    speed_mph ** 4 * -2.05988e-6 +
    speed_mph ** 3 * 7.18938e-5 +
    speed_mph ** 2 * -0.00148959 +
    speed_mph * 0.016547552 +
    -0.072179798
  );
};

module.exports = getGasolinePM10PerVMT;
