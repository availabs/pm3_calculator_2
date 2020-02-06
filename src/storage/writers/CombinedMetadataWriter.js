const _ = require('lodash');

const TmcMetadataWriter = require('./TmcMetadataWriter');
const RisMetadataWriter = require('./RisMetadataWriter');

class CombinedMetadataWriter {
  constructor(config) {
    this.tmcMetadataWriter = new TmcMetadataWriter(config);
    this.tmcMetadataFileName = this.tmcMetadataWriter.fileName;

    this.risMetadataWriter = new RisMetadataWriter(config);
    this.risMetadataFileName = this.risMetadataWriter.fileName;

    this.requiredTmcMetadata = _.union(
      this.tmcMetadataWriter.requiredTmcMetadata,
      this.risMetadataWriter.requiredTmcMetadata
    );
  }

  write(attrs) {
    return Promise.all([
      this.tmcMetadataWriter.write(attrs),
      this.risMetadataWriter.write(attrs)
    ]);
  }

  setOutputDirPath(outputDirPath) {
    this.tmcMetadataWriter.setOutputDirPath(outputDirPath);
    this.risMetadataWriter.setOutputDirPath(outputDirPath);
  }

  end() {
    this.tmcMetadataWriter.end();
    this.risMetadataWriter.end();
  }
}

module.exports = CombinedMetadataWriter;
