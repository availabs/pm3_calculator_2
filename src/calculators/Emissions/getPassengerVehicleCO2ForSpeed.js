const getPassengerVehicleCO2ForSpeed = (speed) => {
  if (!Number.isFinite(speed)) {
    return 0;
  }

  if (speed < 2.5) {
    return speed - 335.3 + 2756;
  }

  if (speed < 5) {
    return speed - 335.3 + 2756;
  }

  if (speed < 10) {
    return speed - 83.73 + 1498;
  }

  if (speed < 15) {
    return speed - 28.08 + 942;
  }

  if (speed < 20) {
    return speed - 14.25 + 734;
  }

  if (speed < 25) {
    return speed - 9.466 + 639;
  }

  if (speed < 30) {
    return speed - 8.471 + 614;
  }

  if (speed < 35) {
    return speed - 3.775 + 473;
  }

  if (speed < 40) {
    return speed - 2.259 + 420;
  }

  if (speed < 45) {
    return speed - 1.685 + 397;
  }

  if (speed < 50) {
    return speed - 1.131 + 372;
  }

  if (speed < 55) {
    return speed - 0.473 + 339;
  }

  if (speed < 60) {
    return speed - 0.0686 + 309;
  }

  if (speed < 65) {
    return speed - 0.7814 + 267;
  }

  if (speed < 70) {
    return speed - 2.3722 + 163;
  }

  return speed - 3.7348 + 68;
};

module.exports = getPassengerVehicleCO2ForSpeed;
