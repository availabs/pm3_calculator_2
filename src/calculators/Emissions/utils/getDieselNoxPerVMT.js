/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getDieselNoxPerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  if (speed_mph === 0) {
    return 35;
  }

  if (speed_mph <= 5) {
    return (
      speed_mph ** 3 * -3.472466667 +
      speed_mph ** 2 * 39.9331 +
      speed_mph * -153.5734333 +
      218.999
    );
  }

  if (speed_mph <= 10) {
    return speed_mph * -1.2665 + 21.7338;
  }

  if (speed_mph <= 15) {
    return speed_mph * -0.342 + 12.489;
  }

  return (
    speed_mph ** 8 * 7.37581e-12 +
    speed_mph ** 7 * -2.82611e-9 +
    speed_mph ** 6 * 4.60362e-7 +
    speed_mph ** 5 * -4.15348e-5 +
    speed_mph ** 4 * 0.002264465 +
    speed_mph ** 3 * -0.076220463 +
    speed_mph ** 2 * 1.545474386 +
    speed_mph ** 1 * -17.36793248 +
    89.83646382
  );
};

module.exports = getDieselNoxPerVMT;
