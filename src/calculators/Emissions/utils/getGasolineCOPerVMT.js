/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getGasolineCOPerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  // TODO: Document Changed exponents from ^4, ^3, ^2 to ^3, ^2, ^1
  //
  //              |   Coefficients
  // Intercept	  |   11.6492957746479
  // X Variable 1	|   -0.008338028169014
  // X Variable 2	|   0.120901408450698
  // X Variable 3	|   -0.642028169014068
  if (speed_mph <= 5) {
    return (
      speed_mph ** 3 * -0.008338028169014 +
      speed_mph ** 2 * 0.120901408450698 +
      speed_mph ** 1 * -0.642028169014068 +
      11.6492957746479
    );
  }

  //              |   Coefficients
  // Intercept	  |   7.35742857142857
  // X Variable 1	|   -0.371457142857143
  if (speed_mph <= 9) {
    return speed_mph * -0.371457142857143 + 7.35742857142857;
  }

  //              |   Coefficients
  // Intercept	  |   4.84919047619048
  // X Variable 1	|   -0.120628571428571
  if (speed_mph <= 15) {
    return speed_mph * -0.120628571428571 + 4.84919047619048;
  }

  const s = Math.min(speed_mph, 72);

  //              |   Coefficients
  // Intercept	  |   7.81691944721381000000
  // X Variable 1	|   0.00000159649120061955
  // X Variable 2	|   -0.00028404123543691400
  // X Variable 3	|   0.01851378292067780000
  // X Variable 4	|   -0.52930476358886900000
  return (
    s ** 4 * 0.00000159649120061955 +
    s ** 3 * -0.000284041235436914 +
    s ** 2 * 0.0185137829206778 +
    s ** 1 * -0.529304763588869 +
    7.81691944721381
  );
};

module.exports = getGasolineCOPerVMT;
