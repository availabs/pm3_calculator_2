/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getDieselNoxPerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  //              |   Coefficients
  // Intercept	  |   218.999000000003
  // X Variable 1	|   -3.47246666666672
  // X Variable 2	|   39.9331000000006
  // X Variable 3	|   -153.573433333336
  if (speed_mph <= 5) {
    return (
      speed_mph ** 3 * -3.47246666666672 +
      speed_mph ** 2 * 39.9331000000006 +
      speed_mph ** 1 * -153.573433333336 +
      218.999000000003
    );
  }

  //              |   Coefficients
  // Intercept	  |   21.7338
  // X Variable 1	|   -1.2665
  if (speed_mph <= 9) {
    return speed_mph * -1.2665 + 21.7338;
  }

  //              |   Coefficients
  // Intercept	  |   12.489
  // X Variable 1	|   -0.342
  if (speed_mph <= 15) {
    return speed_mph * -0.342 + 12.489;
  }

  const s = Math.min(speed_mph, 72);

  //              |   Coefficients
  // Intercept	  |   89.8364638224927
  // X Variable 1	|   7.3758084629589E-12
  // X Variable 2	|   -2.82610659814131E-09
  // X Variable 3	|   4.60361870112212E-07
  // X Variable 4	|   -4.15348451989033E-05
  // X Variable 5	|   0.002264465127397
  // X Variable 6	|   -0.076220463047294
  // X Variable 7	|   1.54547438550957
  // X Variable 8	|   -17.3679324828608
  return (
    s ** 8 * 7.3758084629589e-12 +
    s ** 7 * -2.82610659814131e-9 +
    s ** 6 * 4.60361870112212e-7 +
    s ** 5 * -4.15348451989033e-5 +
    s ** 4 * 0.002264465127397 +
    s ** 3 * -0.076220463047294 +
    s ** 2 * 1.54547438550957 +
    s ** 1 * -17.3679324828608 +
    89.8364638224927
  );
};

module.exports = getDieselNoxPerVMT;
