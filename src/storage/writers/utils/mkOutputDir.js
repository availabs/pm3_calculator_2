/* eslint no-param-reassign: 0, global-require: 0 */

const {execSync} = require('child_process');
const {join} = require('path');

if (!process.env.CALCULATOR_OUTPUT_DIR) {
  require('../../../loadEnvFile');
}

const {CALCULATOR_OUTPUT_DIR = 'output'} = process.env;

const RETRY_LIMIT = Infinity;

const baseDirPath = join(__dirname, '../../../..', CALCULATOR_OUTPUT_DIR);

const mkOutputDir = async (retries = 0) => {
  if (retries === 0) {
    execSync(`mkdir -p ${baseDirPath}`)
  }

  if (retries > RETRY_LIMIT) {
    throw new Error(
      `Failed to create the outputDir after ${retries} attempts.`
    );
  }

  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = `0${date.getMonth() + 1}`.slice(-2);
  const dd = `0${date.getDate()}`.slice(-2);
  const HH = `0${date.getHours()}`.slice(-2);
  const MM = `0${date.getMinutes()}`.slice(-2);
  const SS = `0${date.getSeconds()}`.slice(-2);

  const timestamp = `${yyyy}${mm}${dd}T${HH}${MM}${SS}`;

  const outputDirPath = join(
    baseDirPath,
    `npmrds_measures_calculator_${timestamp}`
  );

  try {
    // We want the atomicity of mkdir
    // https://stackoverflow.com/a/731634/3970755
    execSync(`mkdir ${outputDirPath}`)

    return {
      outputDirPath,
      outputTimestamp: timestamp
    };
  } catch (err) {
    await new Promise(r => setTimeout(r, 3000 * Math.random()));
    return mkOutputDir(++retries);
  }
};

module.exports = mkOutputDir;
