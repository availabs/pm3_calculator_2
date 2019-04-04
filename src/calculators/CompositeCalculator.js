const _ = require('lodash');

const { union } = require('../utils/SetUtils');

const LottrCalculatorFactory = require('./Lottr/LottrCalculatorFactory');
const TttrCalculatorFactory = require('./Tttr/TttrCalculatorFactory');

const measureCalculatorFactories = [
  LottrCalculatorFactory,
  TttrCalculatorFactory
];

class CompositeCalculator {
  constructor() {
    const calcs = measureCalculatorFactories.map(calcFac =>
      calcFac.buildCalculators()
    );
    this.calculators = _.flatten(calcs).filter(calc => calc);

    this.npmrdsDatasources = union(
      ...this.calculators.map(calc => calc.npmrdsDatasources)
    );
  }

  async calculateForTmc({ data, attrs }) {
    return Promise.all(
      this.calculators.map(calc => calc.calculateForTmc({ data, attrs }))
    );
  }
}

module.exports = CompositeCalculator;
