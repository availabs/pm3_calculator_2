const { uniq } = require('../utils/SetUtils');

const CalculatorConfigsBuilder = require('./CalculatorConfigsBuilder');
const MeasureImpls = require('./MeasureImpls');

class CompositeCalculator {
  constructor(calculatorSettings) {
    const calculatorConfigs = CalculatorConfigsBuilder.buildCalculatorConfigs(
      calculatorSettings
    );

    const calcs = Object.keys(calculatorConfigs).reduce((acc, measure) => {
      const configs = calculatorConfigs[measure];

      acc.push(...configs.map(config => new MeasureImpls[measure](config)));

      return acc;
    }, []);

    if (!calcs.length) {
      throw new Error('ERROR: No calculators created.');
    }
    this.calculators = calcs;

    this.npmrdsDataSources = uniq(
      this.calculators.map(calc => calc.npmrdsDataSource)
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
