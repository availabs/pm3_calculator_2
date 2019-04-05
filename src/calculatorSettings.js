const yargs = require('yargs');

// const npmrdsDataSources = require('./enums/npmrdsDataSources');
const { ARITHMETIC, HARMONIC } = require('./enums/meanTypes');

const { cartesianProduct } = require('./utils/SetUtils');

const npmrdsMetrics = require('./enums/npmrdsMetrics');

const {
  names: timePeriodSpecNameEnum
} = require('./calculators/timePeriods/TimePeriodSpecs');

const timePeriodSpecNames = Object.keys(timePeriodSpecNameEnum);

const {
  names: measureNamesEnum,
  configOptions: measureConfigOptions
} = require('./calculators/MeasureMetadata');

const measureNames = Object.keys(measureNamesEnum);

const measureTimePeriodSpecsOptions = cartesianProduct(
  measureNames,
  timePeriodSpecNames
).map(pair => pair.join('.'));

const measureNpmrdsMetricOptions = [
  ...new Set(
    measureNames.reduce((acc, measureName) => {
      const { npmrdsMetrics: supportedNpmrdsMetrics } = measureConfigOptions[
        measureName
      ];
      if (Array.isArray(supportedNpmrdsMetrics)) {
        for (let i = 0; i < supportedNpmrdsMetrics.length; ++i) {
          const npmrdsMetric = supportedNpmrdsMetrics[i];
          acc.push(`${measureName}.${npmrdsMetric}`);
        }
      }
      return acc;
    }, [])
  )
].sort();

const cliArgsSpec = {
  year: {
    demand: true,
    type: 'number'
  },
  head: { type: 'number' },
  tail: { type: 'number' },
  states: { alias: 'state', type: 'array' },
  geolevel: { type: 'string' },
  geocode: { type: 'string' },
  geoname: { type: 'string' },
  tmcs: { alias: 'tmc', type: 'array' },
  config: { alias: 'f', config: true },
  measures: {
    alias: 'measure',
    type: 'array',
    choices: measureNames,
    demand: true
  },
  timeBinSize: { type: 'number', choices: [5, 15, 60], default: 15 },
  meanType: {
    type: 'string',
    choices: [ARITHMETIC, HARMONIC],
    default: ARITHMETIC
  },
  timePeriodSpecs: {
    alias: 'timePeriodSpec',
    type: 'array',
    choices: timePeriodSpecNames
  },
  npmrdsMetrics: {
    alias: 'npmrdsMetric',
    type: 'array',
    choices: Object.keys(npmrdsMetrics)
  },
  measureNpmrdsDataSources: {
    alias: 'measureNpmrdsDataSource',
    type: 'array'
  },
  measureNpmrdsMetrics: {
    alias: 'measureNpmrdsMetric',
    type: 'string',
    choices: measureNpmrdsMetricOptions
  },
  measureTimeperiodSpecs: {
    alias: 'measureTimeperiodSpec',
    type: 'array',
    choices: measureTimePeriodSpecsOptions
  }
};

const { argv } = yargs
  .parserConfiguration({
    'camel-case-expansion': false
  })
  .option(cliArgsSpec);

// Remove the aliases from the config object
//   to simplify the interface and sanitizing.
Object.keys(cliArgsSpec)
  .reduce((acc, k) => {
    const { alias } = cliArgsSpec[k];
    return alias ? acc.concat(alias) : acc;
  }, [])
  .forEach(alias => delete argv[alias]);

const measureSpecificSettings = [
  'measureNpmrdsDataSources',
  'measureNpmrdsMetrics',
  'measureTimePeriodSpecs'
];

// The arrayTypeGlobalSettings and the per measure measureSpecificSettings
//   should be arrays. Cast them from strings to arrays, as needed.

measureSpecificSettings.forEach(settingName => {
  const settingValue = argv[settingName];

  if (settingValue) {
    Object.keys(settingValue).forEach(measure => {
      if (!Array.isArray(settingValue[measure])) {
        settingValue[measure] = [settingValue[measure]];
      }
    });
  }
});

try {
  if (!(argv.states || (argv.geolevel && (argv.geocode || argv.geoname)))) {
    throw new Error(
      'ERROR: A geography is required. Use either\n' +
        '  * the states flag to specify a state or set of states\n' +
        '  * the geolevel flag with the either the geocode or geoname flag to specify a geographic area.'
    );
  }

  if (!(argv.geocode || argv.geoname) && argv.geolevel) {
    throw new Error(
      'ERROR: if a argv.geolevel is specified, either a geocode or geoname is required.'
    );
  }

  if ((argv.geocode || argv.geoname) && !argv.geolevel) {
    throw new Error(
      'ERROR: if a geocode or geoname is specified, the geolevel is required.'
    );
  }

  if (Array.isArray(argv.timeBinSize)) {
    throw new Error(
      'ERROR: Calculator currently supports only one timeBinSize per run.'
    );
  }

  if (Array.isArray(argv.meanType)) {
    throw new Error(
      'ERROR: Calculator currently supports only one meanType per run.'
    );
  }
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(err.message);
  process.exit(1);
}

console.log(JSON.stringify(argv, null, 4));
module.exports = argv;
