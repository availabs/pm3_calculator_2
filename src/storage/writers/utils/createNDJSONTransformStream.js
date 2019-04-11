const through2 = require('through2');

const createNDJSONTransformStream = () =>
  through2.obj(function ndjsonTransformer(d, _, cb) {
    this.push(Buffer.from(`${JSON.stringify(d)}\n`));
    cb();
  });

module.exports = createNDJSONTransformStream;
