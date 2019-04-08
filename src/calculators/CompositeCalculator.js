const { flatten } = require('lodash');
const { uniq } = require('../utils/SetUtils');

const CalculatorConfigsBuilder = require('./CalculatorConfigsBuilder');
const { impls: measureImpls } = require('./MeasureMetadata');

class CompositeCalculator {
  constructor(calculatorSettings) {
    const calculatorConfigs = CalculatorConfigsBuilder.buildCalculatorConfigs(
      calculatorSettings
    );

    const calcs = Object.keys(calculatorConfigs).reduce((acc, measure) => {
      const configs = calculatorConfigs[measure];

      acc.push(...configs.map(config => new measureImpls[measure](config)));

      return acc;
    }, []);

    if (!calcs.length) {
      throw new Error('ERROR: No calculators created.');
    }
    this.calculators = calcs;

    this.npmrdsDataKeys = uniq(
      flatten(this.calculators.map(calc => calc.npmrdsDataKeys))
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
