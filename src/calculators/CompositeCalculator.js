const _ = require('lodash');

const { union } = require('../utils/SetUtils');

const LottrCalculatorFactory = require('./Lottr/LottrCalculatorFactory');
const TttrCalculatorFactory = require('./Tttr/TttrCalculatorFactory');
const PercentBinsReportingCalculatorFactory = require('./PercentBinsReporting/PercentBinsReportingCalculatorFactory');
const SummaryStatisticsCalculatorFactory = require('./SummaryStatistics/SummaryStatisticsCalculatorFactory');

const measureCalculatorFactories = [
  LottrCalculatorFactory,
  TttrCalculatorFactory,
  PercentBinsReportingCalculatorFactory,
  SummaryStatisticsCalculatorFactory
];

class CompositeCalculator {
  constructor() {
    const calcs = _.flatten(
      measureCalculatorFactories.map(calcFac => calcFac.buildCalculators())
    ).filter(calc => calc);

    if (!calcs.length) {
      throw new Error('ERROR: No calculators created.');
    }
    this.calculators = calcs;

    this.npmrdsDataSources = union(
      ...this.calculators.map(calc => calc.npmrdsDataSources)
    );
  }

  async calculateForTmc({ data, attrs }) {
    return (
      this.calculators &&
      Promise.all(
        this.calculators.map(calc => calc.calculateForTmc({ data, attrs }))
      )
    );
  }
}

module.exports = CompositeCalculator;
