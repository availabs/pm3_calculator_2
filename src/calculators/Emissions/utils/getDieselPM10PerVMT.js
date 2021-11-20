/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getDieselPM10PerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  //              |   Coefficients
  // Intercept	  |   0.711799999999998
  // X Variable 1	|   2.66666666667064E-05
  // X Variable 2	|   -0.00032
  // X Variable 3	|   -0.090246666666665
  if (speed_mph <= 5) {
    return (
      speed_mph ** 3 * 2.66666666667064e-5 +
      speed_mph ** 2 * -0.00032 +
      speed_mph ** 1 * -0.090246666666665 +
      0.711799999999998
    );
  }

  //              |   Coefficients
  // Intercept	  |   -0.51870857142853
  // X Variable 1	|   0.001941666666667
  // X Variable 2	|   -0.045771428571427
  // X Variable 3	|   0.330101190476174
  if (speed_mph <= 9) {
    return (
      speed_mph ** 3 * 0.001941666666667 +
      speed_mph ** 2 * -0.045771428571427 +
      speed_mph ** 1 * 0.330101190476174 +
      -0.51870857142853
    );
  }

  //              |   Coefficients
  // Intercept	  |   0.2045
  // X Variable 1	|   -0.0057
  if (speed_mph <= 15) {
    return speed_mph * -0.0057 + 0.2045;
  }

  const s = Math.min(speed_mph, 72);

  //              |   Coefficients
  // Intercept	  |   1.78796246789364
  // X Variable 1	|   1.59025338789712E-13
  // X Variable 2	|   -6.08851667189023E-11
  // X Variable 3	|   9.90171940848851E-09
  // X Variable 4	|   -8.90690050705625E-07
  // X Variable 5	|   4.83195824339469E-05
  // X Variable 6	|   -0.001614033541327
  // X Variable 7	|   0.032361578968289
  // X Variable 8	|   -0.357979789292008
  return (
    s ** 8 * 1.59025338789712e-13 +
    s ** 7 * -6.08851667189023e-11 +
    s ** 6 * 9.90171940848851e-9 +
    s ** 5 * -8.90690050705625e-7 +
    s ** 4 * 4.83195824339469e-5 +
    s ** 3 * -0.001614033541327 +
    s ** 2 * 0.032361578968289 +
    s ** 1 * -0.357979789292008 +
    1.78796246789364
  );
};

module.exports = getDieselPM10PerVMT;
