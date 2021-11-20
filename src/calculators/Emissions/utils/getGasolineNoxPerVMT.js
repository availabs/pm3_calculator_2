/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getGasolineNoxPerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  // TODO: Document Changed exponents from ^4, ^3, ^2 to ^3, ^2, ^1
  //              |   Coefficients
  // Intercept	  |   0.576985915492957
  // X Variable 1	|   -0.00032676056338
  // X Variable 2	|   0.004738028169014
  // X Variable 3	|   -0.025160563380281
  if (speed_mph <= 5) {
    return (
      speed_mph ** 3 * -0.00032676056338 +
      speed_mph ** 2 * 0.004738028169014 +
      speed_mph ** 1 * -0.025160563380281 +
      0.576985915492957
    );
  }

  //              |   Coefficients
  // Intercept	  |   0.4132
  // X Variable 1	|   -0.0154
  if (speed_mph <= 9) {
    return speed_mph * -0.0154 + 0.4132;
  }

  //              |   Coefficients
  // Intercept	  |   0.3265
  // X Variable 1	|   -0.0067
  if (speed_mph <= 15) {
    return speed_mph * -0.0067 + 0.3265;
  }

  const s = Math.min(speed_mph, 72);

  //              |   Coefficients
  // Intercept	  |   0.42532916535368600000
  // X Variable 1 |   0.00000006895040054454
  // X Variable 2 |   -0.00001221631836011240
  // X Variable 3 |   0.00080192912250549100
  // X Variable 4 |   -0.02255666088755890000
  return (
    s ** 4 * 0.00000006895040054454 +
    s ** 3 * -0.0000122163183601124 +
    s ** 2 * 0.000801929122505491 +
    s ** 1 * -0.0225566608875589 +
    0.425329165353686
  );
};

module.exports = getGasolineNoxPerVMT;
