/*
  From ../../../../documentation/emissions2/CMAQTracCalculations.xlsx
*/

const getGasolineVOCPerVMT = (speed_mph) => {
  if (!Number.isFinite(speed_mph) || speed_mph < 0) {
    return 0;
  }

  if (speed_mph <= 5) {
    return (
      speed_mph ** 4 * -0.00051831 +
      speed_mph ** 3 * 0.007515493 +
      speed_mph ** 2 * -0.039909859 +
      0.663253521
    );
  }

  if (speed_mph <= 10) {
    return speed_mph * -0.023 + 0.396;
  }

  if (speed_mph <= 15) {
    return speed_mph * -0.0075 + 0.2407;
  }

  return (
    speed_mph ** 4 * 0.000000033001309 +
    speed_mph ** 3 * -0.000006244064527 +
    speed_mph ** 2 * 0.000448572566697 +
    speed_mph * -0.014982528309102 +
    0.271878657023084
  );
};

module.exports = getGasolineVOCPerVMT;
