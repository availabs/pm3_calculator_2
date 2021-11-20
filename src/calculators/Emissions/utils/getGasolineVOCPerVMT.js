/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getGasolineVOCPerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }
  //              |   Coefficients
  // Intercept	  |   0.66325352112676
  // X Variable 1	|   -0.000518309859155
  // X Variable 2	|   0.007515492957746
  // X Variable 3	|   -0.039909859154929
  if (speed_mph <= 5) {
    return (
      speed_mph ** 3 * -0.000518309859155 +
      speed_mph ** 2 * 0.007515492957746 +
      speed_mph ** 1 * -0.039909859154929 +
      0.66325352112676
    );
  }

  //              |   Coefficients
  // Intercept	  |   0.396
  // X Variable 1	|   -0.023
  if (speed_mph <= 9) {
    return speed_mph * -0.023 + 0.396;
  }

  //              |   Coefficients
  // Intercept	  |   0.2407
  // X Variable 1	|   -0.0075
  if (speed_mph <= 15) {
    return speed_mph * -0.0075 + 0.2407;
  }

  const s = Math.min(speed_mph, 72);

  //              |   Coefficients
  // Intercept	  |   0.271878657023084
  // X Variable 1	|   0.000000033001309
  // X Variable 2	|   -0.000006244064527
  // X Variable 3	|   0.000448572566697
  // X Variable 4	|   -0.014982528309102
  return (
    s ** 4 * 0.000000033001309 +
    s ** 3 * -0.000006244064527 +
    s ** 2 * 0.000448572566697 +
    s ** 1 * -0.014982528309102 +
    0.271878657023084
  );
};

module.exports = getGasolineVOCPerVMT;
