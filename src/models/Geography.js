const { getGeographyAttributes } = require('../storage/daos/GeographyDao');

const stateRE = /[A-Z]{2}/i;
const stateCodeRE = /[0-9]{1,2}/i;

const handleStatesArg = states => {
  const statesArr = [
    ...new Set(
      (Array.isArray(states) ? states : [states])
        .filter(s => s)
        .map(s => `${s}`)
        .sort()
    )
  ];

  if (!statesArr.length) {
    return null;
  }

  if (statesArr.some(s => !s.match(stateRE))) {
    throw new Error(
      'ERROR: GeographyLevel states should be the 2-character abbreviation.'
    );
  }

  return statesArr;
};

const handleStateCodesArg = state_codes => {
  const stateCodesArr = [
    ...new Set(
      (Array.isArray(state_codes) ? state_codes : [state_codes])
        .filter(s => s)
        .map(s => `${s}`)
        .sort()
    )
  ];

  if (!stateCodesArr.length) {
    return null;
  }

  if (stateCodesArr.some(s => !s.match(stateCodeRE))) {
    throw new Error(
      'ERROR: GeographyLevel state_codes should be the fips codes.'
    );
  }

  return stateCodesArr.map(s => `${s}`.slice(-2));
};

class GeographyLevel {
  constructor({
    geolevel = null,
    geocode = null,
    geoname = null,
    states = null,
    state_codes = null
  }) {
    this.geolevel = geolevel;
    this.geocode = geocode;
    this.geoname = geoname;
    this.states = handleStatesArg(states);
    this.state_codes = handleStateCodesArg(state_codes);
  }

  async fillAttributes() {
    const d = await getGeographyAttributes(this);

    if (!d) {
      throw new Error('ERROR: Cannot find geography in the database.');
    }

    Object.assign(this, d);

    return this;
  }
}

module.exports = GeographyLevel;
