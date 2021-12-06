/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getGasolineNoxPerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  if (speed_mph <= 5) {
    return (
      speed_mph ** 4 * -0.000326761 +
      speed_mph ** 3 * 0.004738028 +
      speed_mph ** 2 * -0.025160563 +
      0.576985915
    );
  }

  if (speed_mph <= 10) {
    return speed_mph * -0.0154 + 0.4132;
  }

  if (speed_mph <= 15) {
    return speed_mph * -0.0067 + 0.3265;
  }

  return (
    speed_mph ** 4 * 6.895040054454e-8 +
    speed_mph ** 3 * -0.0000122163183601124 +
    speed_mph ** 2 * 0.000801929122505491 +
    speed_mph * -0.022556608875589 +
    0.425329165353686
  );
};

module.exports = getGasolineNoxPerVMT;
