/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getGasolineCOPerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  //              |   Coefficients
  // Intercept	  |   2313.72347887324
  // X Variable 1	|   -1.78613014084502
  // X Variable 2	|   25.899087042253
  // X Variable 3	|   -137.533920845069
  if (speed_mph <= 5) {
    return (
      speed_mph ** 3 * -1.78613014084502 +
      speed_mph ** 2 * 25.899087042253 +
      speed_mph ** 1 * -137.533920845069 +
      2313.72347887324
    );
  }

  //              |   Coefficients
  // Intercept	  |   1391.9958
  // X Variable 1	|   -79.1132
  if (speed_mph <= 9) {
    return speed_mph * -79.1132 + 1391.9958;
  }

  //              |   Coefficients
  // Intercept	  |   854.9693
  // X Variable 1	|   -25.4105
  if (speed_mph <= 15) {
    return speed_mph * -25.4105 + 854.9693;
  }

  const s = Math.min(speed_mph, 72);

  //              |   Coefficients
  // Intercept	  |   1025.12269379775
  // X Variable 1	|   -7.0788943985666E-07
  // X Variable 2	|   0.00025518164426
  // X Variable 3	|   -0.032716074199199
  // X Variable 4	|   1.98430083630613
  // X Variable 5	|   -59.5693173663526
  return (
    s ** 5 * -7.0788943985666e-7 +
    s ** 4 * 0.00025518164426 +
    s ** 3 * -0.032716074199199 +
    s ** 2 * 1.98430083630613 +
    s ** 1 * -59.5693173663526 +
    1025.12269379775
  );
};

module.exports = getGasolineCOPerVMT;
