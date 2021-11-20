/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getDieselCOPerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  //              |   Coefficients
  // Intercept	  |   15.773
  // X Variable 1	|   0.000266666666667
  // X Variable 2	|   -0.003200000000004
  // X Variable 3	|   -1.88646666666665
  if (speed_mph <= 5) {
    return (
      speed_mph ** 3 * 0.000266666666667 +
      speed_mph ** 2 * -0.003200000000004 +
      speed_mph ** 1 * -1.88646666666665 +
      15.773
    );
  }

  //              |   Coefficients
  // Intercept	  |   8.93
  // X Variable 1	|   -0.527
  if (speed_mph <= 9) {
    return speed_mph * -0.527 + 8.93;
  }

  //              |   Coefficients
  // Intercept	  |   5.3118
  // X Variable 1	|   -0.1652
  if (speed_mph <= 15) {
    return speed_mph * -0.1652 + 5.3118;
  }

  const s = Math.min(speed_mph, 72);

  //              |   Coefficients
  // Intercept	  |   15.2459600957647
  // X Variable 1	|   6.653898174914E-13
  // X Variable 2	|   -2.68015562133462E-10
  // X Variable 3	|   4.58641623050865E-08
  // X Variable 4	|   -4.34254736203597E-06
  // X Variable 5	|   0.00024838107049
  // X Variable 6	|   -0.008793529268233
  // X Variable 7	|   0.189498333175348
  // X Variable 8	|   -2.33792160620663
  return (
    s ** 8 * 6.653898174914e-13 +
    s ** 7 * -2.68015562133462e-10 +
    s ** 6 * 4.58641623050865e-8 +
    s ** 5 * -4.34254736203597e-6 +
    s ** 4 * 0.00024838107049 +
    s ** 3 * -0.008793529268233 +
    s ** 2 * 0.189498333175348 +
    s ** 1 * -2.33792160620663 +
    15.2459600957647
  );
};

module.exports = getDieselCOPerVMT;
