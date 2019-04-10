const yargs = require('yargs');

const { camelCase, lowerCase, upperCase } = require('lodash');

const { uniq } = require('./utils/SetUtils');

const npmrdsDataSources = require('./enums/npmrdsDataSources');
const { ARITHMETIC, HARMONIC } = require('./enums/meanTypes');

const outputFormatsEnum = require('./enums/outputFormats');

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

const measureSpecificCliFlagsRE = new RegExp(
  measureNames.map(m => `^${lowerCase(m)}`).join('|')
);

const generalCliArgsSpec = {
  outputFormat: {
    demand: false,
    type: 'string',
    default: outputFormatsEnum.EAV,
    choices: Object.keys(outputFormatsEnum)
  },
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
    type: 'array',
    choices: [ARITHMETIC, HARMONIC]
  },
  timePeriodSpec: {
    type: 'array',
    choices: timePeriodSpecNames
  },
  npmrdsDataSource: {
    type: 'array',
    choices: Object.keys(npmrdsDataSources)
  },
  npmrdsMetric: {
    type: 'array',
    choices: Object.keys(npmrdsMetrics)
  }
};

const measureOptionsAsCliFlags = measureNames.reduce((acc, measure) => {
  const configOptions = measureConfigOptions[measure];

  if (!configOptions) {
    return acc;
  }

  Object.keys(configOptions).forEach(opt => {
    // const flag = camelCase(`${measure} ${opt}`).replace(/([^s]$)/, '$1s');
    const flag = camelCase(`${measure} ${opt}`);
    acc[flag] = {
      type: 'array',
      choices: configOptions[opt],
      'flatten-duplicate-arrays': false
    };
  });

  return acc;
}, {});

const cliArgsSpec = Object.assign(
  {},
  generalCliArgsSpec,
  measureOptionsAsCliFlags
);

const { argv } = yargs
  .strict()
  .parserConfiguration({
    'camel-case-expansion': false,
    'flatten-duplicate-arrays': false
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

Object.keys(argv)
  .filter(f => f.match(measureSpecificCliFlagsRE))
  .forEach(measureSpecificCliFlag => {
    const measure = upperCase(
      measureSpecificCliFlag.match(measureSpecificCliFlagsRE)
    );

    if (!argv.measures.includes(measure)) {
      throw new Error(
        `ERROR: measure-specific configuration provided for ${measure}, but ${measure} not specified under the "measures" flag.`
      );
    }

    const measureOption = camelCase(
      measureSpecificCliFlag.replace(measureSpecificCliFlagsRE, '')
    );

    argv.measureSpecificSettings = argv.measureSpecificSettings || {};
    argv.measureSpecificSettings[measure] =
      argv.measureSpecificSettings[measure] || {};

    argv.measureSpecificSettings[measure][measureOption] = Array.isArray(
      argv[measureSpecificCliFlag]
    )
      ? uniq(argv[measureSpecificCliFlag])
      : [argv[measureSpecificCliFlag]];

    delete argv[measureSpecificCliFlag];
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

  if (Array.isArray(argv.outputFormat)) {
    throw new Error(
      'ERROR: Calculator currently supports only one outputFormat per run.'
    );
  }
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(err.message);
  process.exit(1);
}

// console.log(JSON.stringify(argv, null, 4));
// process.exit();

module.exports = argv;
