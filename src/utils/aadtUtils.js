const getAadtVehicleClassBreakdown = ({ aadt, aadtCombi, aadtSingl }) => {
  const aadtTruck = aadtSingl + aadtCombi;
  const aadtPass = aadt - aadtTruck;

  return {
    aadt: Number.isFinite(aadt) ? aadt : null,
    aadtCombi: Number.isFinite(aadtCombi) ? aadtCombi : null,
    aadtSingl: Number.isFinite(aadtSingl) ? aadtSingl : null,
    aadtPass: Number.isFinite(aadtPass) ? aadtPass : null,
    aadtTruck: Number.isFinite(aadtTruck) ? aadtTruck : null
  };
};

const getDirectionalAadtVehicleClassBreakdown = params => {
  const { facilType } = params;

  if (!Number.isFinite(facilType)) {
    return {
      directionalAadt: null,
      directionalAadtCombi: null,
      directionalAadtSingl: null,
      directionalAadtPass: null,
      directionalAadtTruck: null
    };
  }

  const {
    aadt,
    aadtCombi,
    aadtSingl,
    aadtPass,
    aadtTruck
  } = getAadtVehicleClassBreakdown(params);

  if (facilType > 1) {
    return {
      directionalAadt: aadt / 2,
      directionalAadtCombi: aadtCombi / 2,
      directionalAadtSingl: aadtSingl / 2,
      directionalAadtPass: aadtPass / 2,
      directionalAadtTruck: aadtTruck / 2
    };
  }

  return {
    directionalAadt: aadt,
    directionalAadtCombi: aadtCombi,
    directionalAadtSingl: aadtSingl,
    directionalAadtPass: aadtPass,
    directionalAadtTruck: aadtTruck
  };
};

module.exports = {
  getAadtVehicleClassBreakdown,
  getDirectionalAadtVehicleClassBreakdown
};
