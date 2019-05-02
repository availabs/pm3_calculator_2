const { isNil } = require('lodash');

const { EAV } = require('../enums/outputFormats');
const { NDJSON } = require('../enums/outputFileFormats');

const { getRequestedGeographies } = require('../requestedGeographies');

const {
  names: { LOTTR, TTTR, PHED }
} = require('../calculators/MeasureMetadata');

const requiredMeasures = [LOTTR, TTTR, PHED];

const { diff: gitDiff, diffCached: gitDiffCached } = require('./GitRepoState');

const hasTmcSubsetFlags = ({ head, tail }) => {
  const disqualifyingFlags = [];

  if (!isNil(head)) {
    disqualifyingFlags.push(`--head=${head}`);
  }
  if (!isNil(tail)) {
    disqualifyingFlags.push(`--tail=${tail}`);
  }

  return disqualifyingFlags.length
    ? `The calculator was run with ${disqualifyingFlags.join(
        ' and '
      )}, possibly making the TMCs a subset of a single, complete state.`
    : null;
};

const hasTmcSupersetFlag = ({ tmcs }) =>
  isNil(tmcs)
    ? null
    : "The calculator was run with the '--tmcs' flag, possibly making the TMCs a superset of a single, complete state.";

const wrongMeasureCalcuatorOutputFormat = ({ outputFormat }) =>
  outputFormat === EAV
    ? null
    : `The specified --outputFormat=${outputFormat} prevents loading the calculator output into the database.`;

const wrongOutputFileFormat = ({ outputFileFormat }) =>
  outputFileFormat === NDJSON
    ? null
    : `The specified --outputFileFormat=${outputFileFormat} prevents loading the calculator output into the database.`;

const notSingleCompleteState = async calculatorSettings => {
  const requestedGeographies = await getRequestedGeographies(
    calculatorSettings
  );

  return !Array.isArray(requestedGeographies) ||
    requestedGeographies.length > 1 ||
    requestedGeographies[0].geolevel !== 'STATE'
    ? 'Authoritative version candidates must be run for a single, complete state.'
    : null;
};

const missingRequiredTmcMetadataFile = ({ outputHPMSRequiredTmcMetadata }) =>
  outputHPMSRequiredTmcMetadata
    ? null
    : 'The calculator did not output the HPMS-required TMC metadata.';

const missingCanonicalVersionsOfRequiredMeasures = calculators => {
  const missingCanonicalMeasures = requiredMeasures.filter(
    reqMeasure =>
      !calculators.some(
        ({ constructor: { measure }, isCanonical }) =>
          measure === reqMeasure && isCanonical
      )
  );

  return missingCanonicalMeasures.length
    ? `The calculator is missing canonical calculations for ${missingCanonicalMeasures
        .join(', ')
        .replace(/, (?!.*, )/, ' and ')}`
    : null;
};

const hasUncommittedCodeChanges = () =>
  gitDiff || gitDiffCached
    ? 'The codebase has uncommited changes in the git repo.'
    : null;

const getAuthoritativeVersionCandidacyDisqualifications = async ({
  calculatorSettings,
  calculators
}) => {
  const disqualifications = [
    hasTmcSubsetFlags(calculatorSettings),
    hasTmcSupersetFlag(calculatorSettings),
    wrongMeasureCalcuatorOutputFormat(calculatorSettings),
    wrongOutputFileFormat(calculatorSettings),
    await notSingleCompleteState(calculatorSettings),
    missingRequiredTmcMetadataFile(calculatorSettings),
    missingCanonicalVersionsOfRequiredMeasures(calculators),
    hasUncommittedCodeChanges()
  ].filter(d => d);

  return disqualifications.length ? disqualifications : null;
};

module.exports = getAuthoritativeVersionCandidacyDisqualifications;
