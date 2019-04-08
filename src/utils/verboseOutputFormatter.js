function verboseFormatter(output) {
  return Object.assign(
    {},
    {
      year: this.year,
      measure: this.measure,
      time_bin_size: this.timeBinSize,
      metric: this.npmrdsMetric,
      data_source: this.npmrdsDataSource
    },
    output
  );
}

module.exports = verboseFormatter;
