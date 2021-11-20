/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getDieselPM2_5PerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  //              |   Coefficients
  // Intercept	  |   0.675599999999999
  // X Variable 1	|   2.66666666666895E-05
  // X Variable 2	|   -0.00032
  // X Variable 3	|   -0.085646666666666
  if (speed_mph <= 5) {
    return (
      speed_mph ** 3 * 2.66666666666895e-5 +
      speed_mph ** 2 * -0.00032 +
      speed_mph ** 1 * -0.085646666666666 +
      0.675599999999999
    );
  }

  //              |   Coefficients
  // Intercept	  |   0.34548
  // X Variable 1	|   -0.02055
  if (speed_mph <= 9) {
    return speed_mph * -0.02055 + 0.34548;
  }

  //              |   Coefficients
  // Intercept	  |   0.19433
  // X Variable 1	|   -0.00543
  if (speed_mph <= 15) {
    return speed_mph * -0.00543 + 0.19433;
  }

  const s = Math.min(speed_mph, 72);

  //              |   Coefficients
  // Intercept	  |   1.70430014424716
  // X Variable 1	|   1.51101977517575E-13
  // X Variable 2	|   -5.7892253777516E-11
  // X Variable 3	|   9.42126204468425E-09
  // X Variable 4	|   -8.47989615154784E-07
  // X Variable 5	|   4.60277487395292E-05
  // X Variable 6	|   -0.001538157903366
  // X Variable 7	|   0.03085047905122
  // X Variable 8	|   -0.34132625472877
  return (
    s ** 8 * 1.51101977517575e-13 +
    s ** 7 * -5.7892253777516e-11 +
    s ** 6 * 9.42126204468425e-9 +
    s ** 5 * -8.47989615154784e-7 +
    s ** 4 * 4.60277487395292e-5 +
    s ** 3 * -0.001538157903366 +
    s ** 2 * 0.03085047905122 +
    s * -0.34132625472877 +
    1.70430014424716
  );
};

module.exports = getDieselPM2_5PerVMT;
