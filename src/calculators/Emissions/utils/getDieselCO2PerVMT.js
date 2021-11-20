/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getDieselCOPerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  //              |   Coefficients
  // Intercept	  |   10482.592
  // X Variable 1	|   0.000266666665708
  // X Variable 2	|   -0.003199999989279
  // X Variable 3	|   -1338.17246666671
  if (speed_mph <= 5) {
    return (
      speed_mph ** 3 * 0.000266666665708 +
      speed_mph ** 2 * -0.003199999989279 +
      speed_mph ** 1 * -1338.17246666671 +
      10482.592
    );
  }

  //              |   Coefficients
  // Intercept	  |   5254.4008
  // X Variable 1	|   -292.5435
  if (speed_mph <= 9) {
    return speed_mph * -292.5435 + 5254.4008;
  }

  //              |   Coefficients
  // Intercept	  |   3080.6692
  // X Variable 1	|   -75.1704
  if (speed_mph <= 15) {
    return speed_mph * -75.1704 + 3080.6692;
  }

  const s = Math.min(speed_mph, 72);

  //              |   Coefficients
  // Intercept	  |   30224.6161926603
  // X Variable 1	|   2.67074464646874E-09
  // X Variable 2	|   -1.01958220181412E-06
  // X Variable 3	|   0.000165527211145
  // X Variable 4	|   -0.014884945385267
  // X Variable 5	|   0.808577495435224
  // X Variable 6	|   -27.0911594178974
  // X Variable 7	|   545.574926452902
  // X Variable 8	|   -6055.84479206879
  return (
    s ** 8 * 2.67074464646874e-9 +
    s ** 7 * -1.01958220181412e-6 +
    s ** 6 * 0.000165527211145 +
    s ** 5 * -0.014884945385267 +
    s ** 4 * 0.808577495435224 +
    s ** 3 * -27.0911594178974 +
    s ** 2 * 545.574926452902 +
    s * -6055.84479206879 +
    30224.6161926603
  );
};

module.exports = getDieselCOPerVMT;
