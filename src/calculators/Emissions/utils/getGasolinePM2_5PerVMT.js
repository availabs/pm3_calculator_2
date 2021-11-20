/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getGasolinePM2_5PerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  //              |   Coefficients
  // Intercept	  |   0.007397183099
  // X Variable 1	|   0.000005314554
  // X Variable 2	|   -0.000030394366
  // X Variable 3	|   -0.000100779343
  if (speed_mph <= 5) {
    return (
      speed_mph ** 3 * 0.000005314554 +
      speed_mph ** 2 * -0.000030394366 +
      speed_mph ** 1 * -0.000100779343 +
      0.007397183099
    );
  }

  //              |   Coefficients
  // Intercept	  |   0.0697000000
  // X Variable 1	|   0.0000166667
  // X Variable 2	|   -0.0005333333
  // X Variable 3	|   0.0063333333
  // X Variable 4	|   -0.0333166667
  if (speed_mph <= 9) {
    return (
      speed_mph ** 4 * 0.0000166667 +
      speed_mph ** 3 * 0.0005333333 +
      speed_mph ** 2 * 0.0063333333 +
      speed_mph ** 1 * 0.0333166667 +
      0.0697
    );
  }

  //              |   Coefficients
  // Intercept	  |   -0.3599000000
  // X Variable 1	|   -0.0000125000
  // X Variable 2	|   0.0006583333
  // X Variable 3	|   -0.0129375000
  // X Variable 4	|   0.1122916667
  if (speed_mph <= 15) {
    return (
      speed_mph ** 4 * -0.0000125 +
      speed_mph ** 3 * 0.0006583333 +
      speed_mph ** 2 * -0.0129375 +
      speed_mph ** 1 * 0.1122916667 +
      -0.3599
    );
  }

  const s = Math.min(speed_mph, 72);

  //              |   Coefficients
  // Intercept	  |   -0.05423602226406020000
  // X Variable 1	|   -0.00000000000000594974
  // X Variable 2	|   0.00000000000222380912
  // X Variable 3	|   -0.00000000035695915395
  // X Variable 4	|   0.00000003205637142505
  // X Variable 5	|   -0.00000175216544229806
  // X Variable 6	|   0.00005915745874860470
  // X Variable 7	|   -0.00118960955018472000
  // X Variable 8	|   0.01285051600779220000
  return (
    s ** 8 * -0.00000000000000594974 +
    s ** 7 * 0.00000000000222380912 +
    s ** 6 * -0.00000000035695915395 +
    s ** 5 * 0.00000003205637142505 +
    s ** 4 * -0.00000175216544229806 +
    s ** 3 * 0.0000591574587486047 +
    s ** 2 * -0.00118960955018472 +
    s ** 1 * 0.0128505160077922 +
    -0.0542360222640602
  );
};

module.exports = getGasolinePM2_5PerVMT;
