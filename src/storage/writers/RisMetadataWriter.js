const { createWriteStream } = require('fs');
const { join } = require('path');
const _ = require('lodash');

const { union } = require('../../utils/SetUtils');

const createNDJSONTransformStream = require('./utils/createNDJSONTransformStream');
const createCSVTransformStream = require('./utils/createCSVTransformStream');

const { NDJSON, CSV } = require('../../enums/outputFileFormats');
const { EAV } = require('../../enums/outputFormats');

const basicOutputFormatters = require('../../utils/basicOutputFormatters');

const transformStreamCreators = {
  [NDJSON]: createNDJSONTransformStream,
  [CSV]: createCSVTransformStream
};

const getRequiredRisMetadata = ({
  outputCalculatorsRequiredMetadata,
  calculators
}) => {
  const loggedRisMetadataLists = [];

  if (outputCalculatorsRequiredMetadata && Array.isArray(calculators)) {
    loggedRisMetadataLists.push(
      ...calculators.reduce((acc, { requiredTmcMetadata }) => {
        const risMetadata = _.isEmpty(requiredTmcMetadata)
          ? null
          : requiredTmcMetadata.filter(f => f.match(/ris/i));

        if (!_.isEmpty(risMetadata)) {
          acc.push(...risMetadata);
        }

        return acc;
      }, [])
    );
  }

  const loggedRisMetadata = union(loggedRisMetadataLists);

  return loggedRisMetadata.length ? loggedRisMetadata : null;
};

function eavFormatter(output) {
  const { tmc } = output;

  const attrs = _.omit(output, 'tmc');

  const baseFields = {
    tmc,
    year: this.year,
    measure: 'RIS_METADATA'
  };

  const formatted = [];

  formatted.push(
    ...Object.keys(attrs).map(k => ({
      ...baseFields,
      attribute: k,
      value: attrs[k]
    }))
  );

  return formatted;
}

const outputFormatters = { [EAV]: eavFormatter, ...basicOutputFormatters };

const getOutputStream = ({
  isActive,
  fileName,
  outputDirPath,
  outputFileFormat
}) => {
  if (!isActive) {
    return null;
  }

  const filePath = join(outputDirPath, fileName);
  const stream = transformStreamCreators[outputFileFormat]();

  stream.pipe(createWriteStream(filePath));

  return stream;
};

class RisMetadataWriter {
  constructor({
    calculatorSettings: {
      year,
      outputCalculatorsRequiredMetadata,
      outputFormat,
      outputFileFormat
    },
    calculators
  }) {
    this.year = year;

    this.requiredTmcMetadata = getRequiredRisMetadata({
      outputCalculatorsRequiredMetadata,
      calculators
    });

    this.isActive = !_.isEmpty(this.requiredTmcMetadata);

    if (this.isActive) {
      this.outputFormatter = outputFormatters[outputFormat].bind(this);

      this.outputFileFormat = outputFileFormat;

      this.fileName = `ris_metadata.${_.lowerCase(this.outputFileFormat)}`;

      // The OutputWriter needs this class' requiredTmcMetadata in its constructor, syncronously.
      // This class needs the OutputWriter's outputDirPath to create the outputStream,
      //   but the outputDirPath is obtained asyncronously by the OutputWriter--it is not
      //   available until after this class instance is created.
      // To handle this intertemporal interdependency,
      //   we wrap this.setOutputDirPath in this.ready's Promise.
      // When the OutputWriter sets the outputDirPath, this writer can create the
      //   outputStream and becomes ready.
      this.ready = new Promise(resolve => {
        // When outputDirPath is set, resolve this promise
        //   This class method is called by the class instance owner.
        this.setOutputDirPath = outputDirPath => {
          this.outputDirPath = outputDirPath;
          this.outputStream = getOutputStream(this);
          resolve();
        };
      });
    } else {
      this.setOutputDirPath = () => {};
      this.ready = Promise.resolve();
    }
  }

  async write(attrs) {
    if (this.isActive) {
      await this.ready;

      const risAttrs = _.pick(attrs, ['tmc', ...this.requiredTmcMetadata]);

      const d = this.outputFormatter(risAttrs);
      const rows = (Array.isArray(d) ? d : [d]).filter(r => r);

      if (!rows.length) {
        return;
      }

      await Promise.all(
        rows.map(
          row => new Promise(resolve => this.outputStream.write(row, resolve))
        )
      );
    }
  }

  end() {
    if (this.outputStream) {
      this.outputStream.end();
    }
  }
}

module.exports = RisMetadataWriter;
