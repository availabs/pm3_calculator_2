const yargs = require('yargs');

const { camelCase, snakeCase, pick } = require('lodash');

const { uniq } = require('./utils/SetUtils');

const {
  names: { LOTTR, TTTR, PHED }
} = require('./calculators/MeasureMetadata');

const npmrdsDataSources = require('./enums/npmrdsDataSources');
const { ARITHMETIC, HARMONIC } = require('./enums/meanTypes');

const outputFileFormatsEnum = require('./enums/outputFileFormats');

const { NDJSON } = outputFileFormatsEnum;

const outputFormatsEnum = require('./enums/outputFormats');

const { EAV, VERBOSE } = outputFormatsEnum;

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
  measureNames
    // FIXME: So phedRis matches before phed.
    //        May be implementation detail rather than JS spec.
    .sort((a,b) => b.length - a.length)
    .map(m => `^${camelCase(m)}`).join('|'),
  'i'
);

const generalCliArgsSpec = {
  progressbar: {
    demand: false,
    type: 'boolean',
    default: true
  },
  outputFileFormat: {
    demand: false,
    type: 'string',
    default: NDJSON,
    choices: Object.keys(outputFileFormatsEnum)
  },
  outputFormat: {
    demand: false,
    type: 'string',
    default: EAV,
    choices: Object.keys(outputFormatsEnum)
  },
  year: {
    demand: true,
    type: 'number'
  },

  outputCalculatorsRequiredMetadata: {
    type: 'boolean',
    default: true
  },
  outputHPMSRequiredTmcMetadata: {
    type: 'boolean',
    default: true
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
    default: [LOTTR, TTTR, PHED]
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
  .wrap(yargs.terminalWidth() / 1.618)
  .option(cliArgsSpec);

// remove all aliases and yargs specific fields
const calculatorSettings = pick(argv, Object.keys(cliArgsSpec));

Object.keys(calculatorSettings)
  .filter(f => f.match(measureSpecificCliFlagsRE))
  .forEach(measureSpecificCliFlag => {
    const measure = snakeCase(
      //  Above filter guarantees match
      measureSpecificCliFlag.match(measureSpecificCliFlagsRE)[0]
    ).toUpperCase();

    if (!calculatorSettings.measures.includes(measure)) {
      throw new Error(
        `ERROR: measure-specific configuration provided for ${measure}, but ${measure} not specified under the "measures" flag.`
      );
    }

    const measureOption = camelCase(
      measureSpecificCliFlag.replace(measureSpecificCliFlagsRE, '')
    );

    calculatorSettings.measureSpecificSettings =
      calculatorSettings.measureSpecificSettings || {};

    calculatorSettings.measureSpecificSettings[measure] =
      calculatorSettings.measureSpecificSettings[measure] || {};

    calculatorSettings.measureSpecificSettings[measure][
      measureOption
    ] = Array.isArray(calculatorSettings[measureSpecificCliFlag])
      ? uniq(calculatorSettings[measureSpecificCliFlag])
      : [calculatorSettings[measureSpecificCliFlag]];

    delete calculatorSettings[measureSpecificCliFlag];
  });

try {
  if (
    !(
      calculatorSettings.tmcs ||
      calculatorSettings.states ||
      (calculatorSettings.geolevel &&
        (calculatorSettings.geocode || calculatorSettings.geoname))
    )
  ) {
    throw new Error(
      'ERROR: A list of tmcs or a geography is required. Use either\n' +
        '  * the tmcs flag to specify a list of tmcs\n' +
        '  * the states flag to specify a state or set of states\n' +
        '  * the geolevel flag with the either the geocode or geoname flag to specify a geographic area.'
    );
  }

  if (
    !(calculatorSettings.geocode || calculatorSettings.geoname) &&
    calculatorSettings.geolevel
  ) {
    throw new Error(
      'ERROR: if a calculatorSettings.geolevel is specified, either a geocode or geoname is required.'
    );
  }

  if (
    (calculatorSettings.geocode || calculatorSettings.geoname) &&
    !calculatorSettings.geolevel
  ) {
    throw new Error(
      'ERROR: if a geocode or geoname is specified, the geolevel is required.'
    );
  }

  if (Array.isArray(calculatorSettings.timeBinSize)) {
    throw new Error(
      'ERROR: Calculator currently supports only one timeBinSize per run.'
    );
  }

  if (Array.isArray(calculatorSettings.outputFileFormat)) {
    throw new Error(
      'ERROR: Calculator currently supports only one outputFileFormat per run.'
    );
  }

  if (Array.isArray(calculatorSettings.outputFormat)) {
    throw new Error(
      'ERROR: Calculator currently supports only one outputFormat per run.'
    );
  }

  if (
    calculatorSettings.outputFormat === VERBOSE &&
    calculatorSettings.outputFileFormat !== NDJSON
  ) {
    throw new Error(
      'ERROR: If outputFormat is "VERBOSE", outputFileFormat must be "NDJSON"'
    );
  }
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(err.message);
  process.exit(1);
}

module.exports = calculatorSettings;
