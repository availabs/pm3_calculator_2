/*
  when (speed>=0 and speed<2.5) then (vmt*((speed*-335.3)+2756))
  when (speed>=2.5 and speed<5) then (vmt*((speed*-335.3)+2756))
  when (speed>=5 and speed<10) then (vmt*((speed*-83.73)+1498))
  when (speed>=10 and speed<15) then (vmt*((speed*-28.08)+942))
  when (speed>=15 and speed<20) then (vmt*((speed*-14.25)+734))
  when (speed>=20 and speed<25) then (vmt*((speed*-9.466)+639))
  when (speed>=25 and speed<30) then (vmt*((speed*-8.471)+614))
  when (speed>=30 and speed<35) then (vmt*((speed*-3.775)+473))
  when (speed>=35 and speed<40) then (vmt*((speed*-2.259)+420))
  when (speed>=40 and speed<45) then (vmt*((speed*-1.685)+397))
  when (speed>=45 and speed<50) then (vmt*((speed*-1.131)+372))
  when (speed>=50 and speed<55) then (vmt*((speed*-0.473)+339))
  when (speed>=55 and speed<60) then (vmt*((speed*0.0686)+309))
  when (speed>=60 and speed<65) then (vmt*((speed*0.7814)+267))
  when (speed>=65 and speed<70) then (vmt*((speed*2.3722)+163))
  when (speed>=70 and speed<72.5) then (vmt*((speed*3.7348)+68))
  else (vmt*((speed*3.7348)+68))
*/

const getPassengerVehicleCO2PerVMT = (speed) => {
  if (!Number.isFinite(speed)) {
    return 0;
  }

  if (speed < 2.5) {
    return speed * -335.3 + 2756;
  }

  if (speed < 5) {
    return speed * -335.3 + 2756;
  }

  if (speed < 10) {
    return speed * -83.73 + 1498;
  }

  if (speed < 15) {
    return speed * -28.08 + 942;
  }

  if (speed < 20) {
    return speed * -14.25 + 734;
  }

  if (speed < 25) {
    return speed * -9.466 + 639;
  }

  if (speed < 30) {
    return speed * -8.471 + 614;
  }

  if (speed < 35) {
    return speed * -3.775 + 473;
  }

  if (speed < 40) {
    return speed * -2.259 + 420;
  }

  if (speed < 45) {
    return speed * -1.685 + 397;
  }

  if (speed < 50) {
    return speed * -1.131 + 372;
  }

  if (speed < 55) {
    return speed * -0.473 + 339;
  }

  if (speed < 60) {
    return speed * 0.0686 + 309;
  }

  if (speed < 65) {
    return speed * 0.7814 + 267;
  }

  if (speed < 70) {
    return speed * 2.3722 + 163;
  }

  return speed * 3.7348 + 68;
};

module.exports = getPassengerVehicleCO2PerVMT;
