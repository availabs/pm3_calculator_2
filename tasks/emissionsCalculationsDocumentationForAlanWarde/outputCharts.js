#!/usr/bin/env node

const {
  mkdirSync,
  promises: { writeFile },
} = require('fs');

const { join } = require('path');

const _ = require('lodash');

const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const requireCalcFn = (moduleName) =>
  require(join('../../src/calculators/Emissions/utils/', moduleName));

const requireNysdotEst = (pollutant, fuelType) =>
  require(join(
    __dirname,
    './nysdotEmissionEstimates/',
    `${fuelType}-${pollutant}.json`,
  ));

const chartsDir = join(__dirname, 'emissions_charts');
mkdirSync(chartsDir, { recursive: true });

const pollutantCalcFns = {
  CO: {
    gasoline: requireCalcFn('getGasolineCOPerVMT'),
    diesel: requireCalcFn('getDieselCOPerVMT'),
  },
  CO2: {
    gasoline: requireCalcFn('getGasolineCO2PerVMT'),
    diesel: requireCalcFn('getDieselCO2PerVMT'),
  },
  NOx: {
    gasoline: requireCalcFn('getGasolineNoxPerVMT'),
    diesel: requireCalcFn('getDieselNoxPerVMT'),
  },
  PM2_5: {
    gasoline: requireCalcFn('getGasolinePM2_5PerVMT'),
    diesel: requireCalcFn('getDieselPM2_5PerVMT'),
  },
  PM10: {
    gasoline: requireCalcFn('getGasolinePM10PerVMT'),
    diesel: requireCalcFn('getDieselPM10PerVMT'),
  },
  VOC: {
    gasoline: requireCalcFn('getGasolineVOCPerVMT'),
    diesel: requireCalcFn('getDieselVOCPerVMT'),
  },
};

const nysdotEmissionEstimates = {
  CO: {
    gasoline: requireNysdotEst('CO', 'gasoline'),
    diesel: requireNysdotEst('CO', 'diesel'),
  },
  CO2: {
    gasoline: requireNysdotEst('CO2', 'gasoline'),
    diesel: requireNysdotEst('CO2', 'diesel'),
  },
  NOx: {
    gasoline: requireNysdotEst('NOx', 'gasoline'),
    diesel: requireNysdotEst('NOx', 'diesel'),
  },
  PM2_5: {
    gasoline: requireNysdotEst('PM2_5', 'gasoline'),
    diesel: requireNysdotEst('PM2_5', 'diesel'),
  },
  PM10: {
    gasoline: requireNysdotEst('PM10', 'gasoline'),
    diesel: requireNysdotEst('PM10', 'diesel'),
  },
  VOC: {
    gasoline: requireNysdotEst('VOC', 'gasoline'),
    diesel: requireNysdotEst('VOC', 'diesel'),
  },
};

async function createEmissionsChartPng({
  pollutant,
  fuelType,
  Speed,
  CMACTrac,
  NYSDOT_Estimate,
  AVAIL_Estimate,
}) {
  const height = 800;
  const width = height * 1.618;

  let p = pollutant;

  if (p === 'CO2') {
    p = 'CO²';
  }

  if (p === 'PM10') {
    p = 'PM₁₀';
  }

  if (p === 'PM2_5') {
    p = 'PM₂.₅';
  }

  const configuration = {
    type: 'line',
    data: {
      labels: Speed,
      datasets: [
        {
          data: AVAIL_Estimate,
          label: `AVAIL Estimate`,
          backgroundColor: 'black',
          borderColor: 'black',
          borderDash: [15, 30],
        },
        {
          data: NYSDOT_Estimate,
          label: `NYSDOT Est`,
          backgroundColor: 'red',
          borderColor: 'red',
          borderDash: [30, 15],
        },
        {
          data: CMACTrac,
          label: `CMAC Trac`,
          backgroundColor: '#00FFFF',
          borderColor: '#00FFFF',
        },
      ],
    },
    options: {
      layout: {
        padding: {
          top: 10,
          left: 10,
          bottom: 10,
          right: 30,
        },
      },
      elements: { point: { radius: 0 } },
      scales: {
        xAxis: {
          title: {
            display: true,
            text: 'Vehicle Speed (mph)',
            padding: 10,
            font: {
              size: 16,
            },
          },
        },
        yAxis: {
          title: {
            display: true,
            text: 'Pollutant Grams per Vehicle Mile',
            padding: 10,
            font: {
              size: 16,
            },
          },
        },
      },
      plugins: {
        title: {
          display: true,
          text: `${p} ${_.capitalize(fuelType)} Emissions`,
          padding: 10,
          font: {
            size: 20,
            weight: 'bold',
          },
        },
      },
    },
  };

  const chartCallback = (ChartJS) => {
    ChartJS.defaults.responsive = true;
    ChartJS.defaults.maintainAspectRatio = false;
  };

  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width,
    height,
    chartCallback,
  });

  return chartJSNodeCanvas.renderToBuffer(configuration);
}

const createDataForPollutant = (pollutant, fuelType, speeds) =>
  speeds.map(pollutantCalcFns[pollutant][fuelType]);

async function main() {
  const pollutants = Object.keys(pollutantCalcFns);
  const fuelTypes = ['gasoline', 'diesel'];

  const pairs = pollutants.reduce((acc, pollutant) => {
    for (const fuelType of fuelTypes) {
      acc.push([pollutant, fuelType]);
    }
    return acc;
  }, []);

  await Promise.all(
    pairs.map(async ([pollutant, fuelType]) => {
      const { Speed, CMACTrac, NYSDOT_Estimate } = nysdotEmissionEstimates[
        pollutant
      ][fuelType];

      const AVAIL_Estimate = createDataForPollutant(pollutant, fuelType, Speed);

      const chart = await createEmissionsChartPng({
        pollutant,
        fuelType,
        Speed,
        CMACTrac,
        NYSDOT_Estimate,
        AVAIL_Estimate,
      });

      await writeFile(
        join(chartsDir, `${fuelType}-${pollutant}.png`),
        chart,
        'base64',
      );
    }),
  );
}

main();
