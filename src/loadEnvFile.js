const { join } = require('path');

const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

const envFilePath = join(__dirname, '../.env');

const preConfig = dotenv.config({ path: envFilePath });

dotenvExpand(preConfig);
