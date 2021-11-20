/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getGasolinePM10PerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  //              |   Coefficients
  // Intercept	  |   0.009154929577465
  // X Variable 1	|   -5.63380281690117E-06
  // X Variable 2	|   8.1690140845068E-05
  // X Variable 3	|   -0.000433802816901
  if (speed_mph <= 5) {
    return (
      speed_mph ** 3 * -5.63380281690117e-6 +
      speed_mph ** 2 * 8.1690140845068e-5 +
      speed_mph ** 1 * -0.000433802816901 +
      0.009154929577465
    );
  }

  //              |   Coefficients
  // Intercept	  |   -0.057799999999956
  // X Variable 1	|   -1.66666666666569E-05
  // X Variable 2	|   0.000533333333333
  // X Variable 3	|   -0.006333333333329
  // X Variable 4	|   0.032816666666645
  if (speed_mph <= 9) {
    return (
      speed_mph ** 4 * -1.66666666666569e-5 +
      speed_mph ** 3 * 0.000533333333333 +
      speed_mph ** 2 * -0.006333333333329 +
      speed_mph ** 1 * 0.032816666666645 +
      -0.057799999999956
    );
  }

  //              |   Coefficients
  // Intercept	  |   0.469999999999853
  // X Variable 1	|   1.66666666666611E-05
  // X Variable 2	|   -0.000866666666666
  // X Variable 3	|   0.016833333333328
  // X Variable 4	|   -0.144883333333287
  if (speed_mph <= 15) {
    return (
      speed_mph ** 4 * 1.66666666666611e-5 +
      speed_mph ** 3 * -0.000866666666666 +
      speed_mph ** 2 * 0.016833333333328 +
      speed_mph ** 1 * -0.144883333333287 +
      0.469999999999853
    );
  }

  const s = Math.min(speed_mph, 72);

  //              |   Coefficients
  // Intercept	  |   -0.072179797829012
  // X Variable 1	|   -5.92598566933446E-15
  // X Variable 2	|   2.31630952669437E-12
  // X Variable 3	|   -3.88249362117431E-10
  // X Variable 4	|   3.6313509013578E-08
  // X Variable 5	|   -2.05988276327127E-06
  // X Variable 6	|   7.18938456481959E-05
  // X Variable 7	|   -0.001489590472539
  // X Variable 8	|   0.016547551545417
  return (
    s ** 8 * -5.92598566933446e-15 +
    s ** 7 * 2.31630952669437e-12 +
    s ** 6 * -3.88249362117431e-10 +
    s ** 5 * 3.6313509013578e-8 +
    s ** 4 * -2.05988276327127e-6 +
    s ** 3 * 7.18938456481959e-5 +
    s ** 2 * -0.001489590472539 +
    s ** 1 * 0.016547551545417 +
    -0.072179797829012
  );
};

module.exports = getGasolinePM10PerVMT;
