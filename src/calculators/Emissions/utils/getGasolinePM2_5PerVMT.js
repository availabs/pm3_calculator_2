/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getGasolinePM2_5PerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  if (speed_mph <= 5) {
    return (
      speed_mph ** 4 * 0.000005314554 +
      speed_mph ** 3 * -0.000030394366 +
      speed_mph ** 2 * -0.000100779343 +
      0.007397183099
    );
  }

  if (speed_mph <= 10) {
    return (
      speed_mph ** 4 * 0.0000166667 +
      speed_mph ** 3 * -0.0005333333 +
      speed_mph ** 2 * 0.0063333333 +
      speed_mph * -0.0333166667 +
      0.0697
    );
  }

  if (speed_mph <= 15) {
    return (
      speed_mph ** 4 * -0.0000125 +
      speed_mph ** 3 * 0.0006583333 +
      speed_mph ** 2 * -0.0129375 +
      speed_mph * 0.1122916667 +
      -0.3599
    );
  }

  return (
    speed_mph ** 8 * -0.00000000000000594974 +
    speed_mph ** 7 * 0.00000000000222380912 +
    speed_mph ** 6 * -0.00000000035695915395 +
    speed_mph ** 5 * 0.00000003205637142505 +
    speed_mph ** 4 * -0.00000175216544229806 +
    speed_mph ** 3 * 0.0000591574587486047 +
    speed_mph ** 2 * -0.00118960955018472 +
    speed_mph * 0.0128505160077922 +
    -0.0542360222640602
  );
};

module.exports = getGasolinePM2_5PerVMT;
