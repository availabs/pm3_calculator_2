const { createWriteStream } = require('fast-csv');

const createCSVTransformStream = () => {
  const stream = createWriteStream({
    headers: true,
    strictColumnHandling: true
  });

  stream.on('data-invalid', () => {
    throw new Error('INVALID DATA');
  });

  return stream;
};

module.exports = createCSVTransformStream;
