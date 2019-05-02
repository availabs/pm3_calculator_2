const memoizeOne = require('memoize-one');
const { equal } = require('lodash');

const Geography = require('./models/Geography');

const getRequestedGeographies = memoizeOne(
  async ({ states, geolevel, geocode, geoname }) => {
    const statesArr = [...new Set(states)].filter(s => s);

    const geographies = [];

    if (statesArr.length) {
      for (let i = 0; i < statesArr.length; ++i) {
        const state = states[i];

        if (geolevel) {
          const geography = new Geography({
            states: state,
            geolevel,
            geocode,
            geoname
          });
          geographies.push(geography);
        } else {
          const geography = new Geography({
            states: state,
            geolevel: 'STATE'
          });
          geographies.push(geography);
        }
      }
    } else if (geolevel) {
      const geography = new Geography({
        geolevel,
        geocode,
        geoname
      });
      geographies.push(geography);
    }

    await Promise.all(geographies.map(geo => geo.fillAttributes()));

    return geographies;
  },
  equal
);

module.exports = { getRequestedGeographies };
