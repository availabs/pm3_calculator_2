const { execSync } = require('child_process');
const { join } = require('path');

const PROJECT_ROOT = join(__dirname, '../../');

const opts = { cwd: PROJECT_ROOT, encoding: 'utf8' };

const hash = execSync('git rev-parse HEAD', opts);

const diff = execSync('git diff', opts);

const diffCached = execSync('git diff --cached', opts);

module.exports = { hash, diff, diffCached };
