// when (speed>=0 and speed<2.5) then (vmtt*((speed*-1508.86)+11551.62))
// when (speed>=2.5 and speed<5) then (vmtt*((speed*-1508.86)+211551.62))
// when (speed>=5 and speed<10) then (vmtt*((speed*-312)+5567.34))
// when (speed>=10 and speed<15) then (vmtt*((speed*-78.35)+3230.75))
// when (speed>=15 and speed<20) then (vmtt*((speed*-56.38)+2901.32))
// when (speed>=20 and speed<25) then (vmtt*((speed*-34.75)+2468.71))
// when (speed>=25 and speed<30) then (vmtt*((speed*-12.02)+1900.28))
// when (speed>=30 and speed<35) then (vmtt*((speed*-48.01)+2980.11))
// when (speed>=35 and speed<40) then (vmtt*((speed*-13.48)+1771.60))
// when (speed>=40 and speed<45) then (vmtt*((speed*-10.71)+1660.88))
// when (speed>=45 and speed<50) then (vmtt*((speed*-13.84)+1801.47))
// when (speed>=50 and speed<55) then (vmtt*((speed*-12.68)+1743.63))
// when (speed>=55 and speed<60) then (vmtt*((speed*7.60)+1464.06))
// when (speed>=60 and speed<65) then (vmtt*((speed*011.17)+337.87))
// when (speed>=65 and speed<70) then (vmtt*((speed*10.35)+391.40))
// when (speed>=70 and speed<72.5) then (vmtt*((speed*15.37)+40.07))
// else (vmtt*((speed*15.37)+40.07))

const getFreightTruckCO2PerVMT = (speed) => {
  if (!Number.isFinite(speed)) {
    return 0;
  }

  if (speed < 2.5) {
    return speed * -1508.86 + 11551.62;
  }

  if (speed < 5) {
    return speed * -1508.86 + 211551.62;
  }

  if (speed < 10) {
    return speed * -312 + 5567.34;
  }

  if (speed < 15) {
    return speed * -78.35 + 3230.75;
  }

  if (speed < 20) {
    return speed * -56.38 + 2901.32;
  }

  if (speed < 25) {
    return speed * -34.75 + 2468.71;
  }

  if (speed < 30) {
    return speed * -12.02 + 1900.28;
  }

  if (speed < 35) {
    return speed * -48.01 + 2980.11;
  }

  if (speed < 40) {
    return speed * -13.48 + 1771.6;
  }

  if (speed < 45) {
    return speed * -10.71 + 1660.88;
  }

  if (speed < 50) {
    return speed * -13.84 + 1801.47;
  }

  if (speed < 55) {
    return speed * -12.68 + 1743.63;
  }

  if (speed < 60) {
    return speed * 7.6 + 1464.06;
  }

  if (speed < 65) {
    return speed * 11.17 + 337.87;
  }

  if (speed < 70) {
    return speed * 10.35 + 391.4;
  }

  return speed * 15.37 + 40.07;
};

module.exports = getFreightTruckCO2PerVMT;
