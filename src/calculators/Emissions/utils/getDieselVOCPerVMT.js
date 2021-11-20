/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getDieselVOCPerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  //              |   Coefficients
  // Intercept	  |   5.26300000000001
  // X Variable 1	|   -0.000266666666667
  // X Variable 2	|   0.003200000000003
  // X Variable 3	|   -0.669533333333345
  if (speed_mph <= 5) {
    return (
      speed_mph ** 3 * -0.000266666666667 +
      speed_mph ** 2 * 0.003200000000003 +
      speed_mph ** 1 * -0.669533333333345 +
      5.26300000000001
    );
  }

  //              |   Coefficients
  // Intercept	  |   2.8684
  // X Variable 1	|   -0.1812
  if (speed_mph <= 9) {
    return speed_mph * -0.1812 + 2.8684;
  }

  //              |   Coefficients
  // Intercept	  |   1.6613
  // X Variable 1	|   -0.0605
  if (speed_mph <= 15) {
    return speed_mph * -0.0605 + 1.6613;
  }

  const s = Math.min(speed_mph, 72);

  //              |   Coefficients
  // Intercept	  |   1.87800610074841
  // X Variable 1	|   -1.7128685083299E-13
  // X Variable 2	|   5.80467303805154E-11
  // X Variable 3	|   -8.1673702174109E-09
  // X Variable 4	|   6.13153756974172E-07
  // X Variable 5	|   -2.60069637011913E-05
  // X Variable 6	|   0.000585236045283
  // X Variable 7	|   -0.004367529404875
  // X Variable 8	|   -0.078028096377872
  return (
    s ** 8 * -1.7128685083299e-13 +
    s ** 7 * 5.80467303805154e-11 +
    s ** 6 * -8.1673702174109e-9 +
    s ** 5 * 6.13153756974172e-7 +
    s ** 4 * -2.60069637011913e-5 +
    s ** 3 * 0.000585236045283 +
    s ** 2 * -0.004367529404875 +
    s ** 1 * -0.078028096377872 +
    1.87800610074841
  );
};

module.exports = getDieselVOCPerVMT;
