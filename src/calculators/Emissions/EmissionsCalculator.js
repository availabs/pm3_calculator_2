const assert = require('assert');

const _ = require('lodash');

const {
  getFractionOfDailyAadtByMonthByDowByTimeBin,
} = require('../../storage/daos/TrafficDistributionProfilesDao');

const { CATTLAB } = require('../../enums/trafficDistributionProfilesVersions');

const { HARMONIC } = require('../../enums/meanTypes');
const { SPEED } = require('../../enums/npmrdsMetrics');
const { IDENTITY } = require('../../enums/outputFormats');

const { union } = require('../../utils/SetUtils');

const TrafficDistributionFactorsCalculator = require('../TrafficDistributionFactors/TrafficDistributionFactorsCalculator');

const createTimePeriodIdentifier = require('../timePeriods/createTimePeriodIdentifier');
const { listTimePeriodsInSpec } = require('../timePeriods/timePeriodUtils');

const { getNpmrdsDataKey } = require('../../utils/NpmrdsDataKey');

const npmrdsDataSourcesEnum = require('../../enums/npmrdsDataSources');

const getPassengerVehicleCO2PerVMT = require('./utils/getPassengerVehicleCO2PerVMT');
const getFreightTruckCO2PerVMT = require('./utils/getFreightTruckCO2PerVMT');

const getGasolineCOPerVMT = require('./utils/getGasolineCOPerVMT');
const getGasolineCO2PerVMT = require('./utils/getGasolineCO2PerVMT');
const getGasolineNoxPerVMT = require('./utils/getGasolineNoxPerVMT');
const getGasolinePM2_5PerVMT = require('./utils/getGasolinePM2_5PerVMT');
const getGasolinePM10PerVMT = require('./utils/getGasolinePM10PerVMT');
const getGasolineVOCPerVMT = require('./utils/getGasolineVOCPerVMT');

const getDieselCOPerVMT = require('./utils/getDieselCOPerVMT');
const getDieselCO2PerVMT = require('./utils/getDieselCO2PerVMT');
const getDieselNoxPerVMT = require('./utils/getDieselNoxPerVMT');
const getDieselPM2_5PerVMT = require('./utils/getDieselPM2_5PerVMT');
const getDieselPM10PerVMT = require('./utils/getDieselPM10PerVMT');
const getDieselVOCPerVMT = require('./utils/getDieselVOCPerVMT');

const { ALL, PASS, TRUCK } = npmrdsDataSourcesEnum;

const [speedAllVehicles, speedPassengerVehicles, speedFreighTrucks] = [
  ALL,
  PASS,
  TRUCK,
].map((npmrdsDataSource) =>
  getNpmrdsDataKey({
    meanType: HARMONIC,
    npmrdsMetric: SPEED,
    npmrdsDataSource,
  }),
);

const {
  names: timePeriodSpecNamesEnum,
  specs: generalTimePeriodSpecs,
} = require('../timePeriods/TimePeriodSpecs');

const { PM3_TIME_PERIOD_SPEC } = timePeriodSpecNamesEnum;

const timePeriodSpecDef = generalTimePeriodSpecs[PM3_TIME_PERIOD_SPEC];
const timePeriodNames = Object.keys(timePeriodSpecDef);

const outputFormatters = require('./EmissionsOutputFormatters');

const npmrdsDataKeys = [
  speedAllVehicles,
  speedPassengerVehicles,
  speedFreighTrucks,
];

const EMISSIONS = 'EMISSIONS';

const dirAadtTypes = [
  'directionalAadtPass',
  'directionalAadtSingl',
  'directionalAadtCombi',
];

const trafficDistributionProfilesVersion = CATTLAB;

function isCanonicalConfig(configDefaults) {
  return (
    this.timeBinSize === 15 &&
    Object.keys(configDefaults).every((k) =>
      _.isEqual(this[k], configDefaults[k]),
    )
  );
}

class EmissionsCalculator {
  constructor(calcConfigParams) {
    this.year = calcConfigParams.year;
    this.meanType = calcConfigParams.meanType;
    this.timeBinSize = calcConfigParams.timeBinSize;

    // Use the same binSize for the timeBinSize & trafficDistributionTimeBinSize
    this.trafficDistributionTimeBinSize = this.timeBinSize;

    this.dirAadtTypes = dirAadtTypes;

    this.outputFormatter = outputFormatters[calcConfigParams.outputFormat].bind(
      this,
    );

    this.timePeriodIdentifier = createTimePeriodIdentifier(timePeriodSpecDef);
    this.timePeriods = listTimePeriodsInSpec(timePeriodSpecDef);

    this.npmrdsDataKeys = npmrdsDataKeys;

    this.trafficDistributionFactorsCalculator = new TrafficDistributionFactorsCalculator(
      Object.assign({}, calcConfigParams, {
        outputFormat: IDENTITY,
        trafficDistributionTimeBinSize: this.trafficDistributionTimeBinSize,
      }),
    );

    this.isCanonical = isCanonicalConfig.call(
      this,
      EmissionsCalculator.configDefaults,
    );
  }

  get requiredTmcMetadata() {
    return union(
      ['isprimary', 'miles', 'functionalClass'],
      this.dirAadtTypes,
      this.trafficDistributionFactorsCalculator.requiredTmcMetadata,
    );
  }

  getDirAadts(attrs) {
    const {
      directionalAadtPass,
      directionalAadtSingl,
      directionalAadtCombi,
    } = attrs;

    return {
      passDirAadt: directionalAadtPass,
      singlDirAadt: directionalAadtSingl,
      combiDirAadt: directionalAadtCombi,
    };
  }

  async calculateForTmc({ data, attrs }) {
    // FIXME: Do this once. Not in every calculateForTmc.
    data.sort(
      (a, b) => a.date.localeCompare(b.date) || a.timeBinNum - b.timeBinNum,
    );

    const { tmc, miles, functionalClass } = attrs;

    const { passDirAadt, singlDirAadt, combiDirAadt } = this.getDirAadts(attrs);

    const {
      congestionLevel,
      directionality,
    } = await this.trafficDistributionFactorsCalculator.calculateForTmc({
      data,
      attrs,
    });

    const fractionOfDailyAadtByMonthByDowByTimeBin = await getFractionOfDailyAadtByMonthByDowByTimeBin(
      {
        functionalClass,
        congestionLevel,
        directionality,
        trafficDistributionProfilesVersion,
        trafficDistributionTimeBinSize: this.trafficDistributionTimeBinSize,
        timeBinSize: this.timeBinSize,
      },
    );

    assert(Array.isArray(fractionOfDailyAadtByMonthByDowByTimeBin));
    assert.strictEqual(fractionOfDailyAadtByMonthByDowByTimeBin.length, 12);

    // https://www.fhwa.dot.gov/Environment/air_quality/conformity/research/sample_methodologies/emismeth03.cfm
    //
    // When developing area-wide emissions estimates, users typically input the share
    //   of VMT that occurs at the different speed levels, and MOBILE6 then weights
    //   the speed-specific emission rates by VMT to produce a composite emission factor.

    const getInitializedKeyedEmissionsTotals = (keys) =>
      keys.reduce((acc, k) => {
        acc[k] = ['total', ...timePeriodNames].reduce((acc2, timePeriod) => {
          acc2[timePeriod] = 0;
          return acc2;
        }, {});
        return acc;
      }, {});

    const co2Emissions = getInitializedKeyedEmissionsTotals([
      'pass',
      'singl',
      'combi',
    ]);

    const passGasolineVehicleEmissions = getInitializedKeyedEmissionsTotals([
      'co',
      'co2',
      'nox',
      'pm2_5',
      'pm10',
      'voc',
    ]);

    const singlDieselVehicleEmissions = _.cloneDeep(
      passGasolineVehicleEmissions,
    );
    const combiDieselVehicleEmissions = _.cloneDeep(
      passGasolineVehicleEmissions,
    );

    for (let i = 0; i < data.length; ++i) {
      const row = data[i];

      assert.strictEqual(row.tmc, attrs.tmc);

      const timePeriod = this.timePeriodIdentifier(row);

      const { [speedAllVehicles]: allSpeed, dow, month, timeBinNum } = row;

      let {
        [speedPassengerVehicles]: passSpeed,
        [speedFreighTrucks]: truckSpeed,
      } = row;

      passSpeed = passSpeed || allSpeed;
      truckSpeed = truckSpeed || allSpeed;

      assert(!_.isNil(speedAllVehicles));
      assert(!_.isNil(speedFreighTrucks));

      const fractionOfDailyAadt =
        fractionOfDailyAadtByMonthByDowByTimeBin[month][dow][timeBinNum];

      const [vmtPass, vmtSingl, vmtCombi] = [
        passDirAadt,
        singlDirAadt,
        combiDirAadt,
      ].map((dirAadt) => dirAadt * fractionOfDailyAadt * miles);

      const passCO2 = getPassengerVehicleCO2PerVMT(passSpeed);
      const truckCO2 = getFreightTruckCO2PerVMT(truckSpeed);

      co2Emissions.pass.total += passCO2 * vmtPass;
      co2Emissions.pass[timePeriod] += passCO2 * vmtPass;

      co2Emissions.singl.total += truckCO2 * vmtSingl;
      co2Emissions.singl[timePeriod] += truckCO2 * vmtSingl;

      co2Emissions.combi.total += truckCO2 * vmtCombi;
      co2Emissions.combi[timePeriod] += truckCO2 * vmtCombi;

      const gasCO = getGasolineCOPerVMT(passSpeed);
      const gasCO2 = getGasolineCO2PerVMT(passSpeed);
      const gasNox = getGasolineNoxPerVMT(passSpeed);
      const gasPm2_5 = getGasolinePM2_5PerVMT(passSpeed);
      const gasPm10 = getGasolinePM10PerVMT(passSpeed);
      const gasVoc = getGasolineVOCPerVMT(passSpeed);

      passGasolineVehicleEmissions.co.total += gasCO * vmtPass;
      passGasolineVehicleEmissions.co[timePeriod] += gasCO * vmtPass;
      passGasolineVehicleEmissions.co2.total += gasCO2 * vmtPass;
      passGasolineVehicleEmissions.co2[timePeriod] += gasCO2 * vmtPass;
      passGasolineVehicleEmissions.nox.total += gasNox * vmtPass;
      passGasolineVehicleEmissions.nox[timePeriod] += gasNox * vmtPass;
      passGasolineVehicleEmissions.pm2_5.total += gasPm2_5 * vmtPass;
      passGasolineVehicleEmissions.pm2_5[timePeriod] += gasPm2_5 * vmtPass;
      passGasolineVehicleEmissions.pm10.total += gasPm10 * vmtPass;
      passGasolineVehicleEmissions.pm10[timePeriod] += gasPm10 * vmtPass;
      passGasolineVehicleEmissions.voc.total += gasVoc * vmtPass;
      passGasolineVehicleEmissions.voc[timePeriod] += gasVoc * vmtPass;

      const dieselCO = getDieselCOPerVMT(truckSpeed);
      const dieselCO2 = getDieselCO2PerVMT(truckSpeed);
      const dieselNox = getDieselNoxPerVMT(truckSpeed);
      const dieselPm2_5 = getDieselPM2_5PerVMT(truckSpeed);
      const dieselPm10 = getDieselPM10PerVMT(truckSpeed);
      const dieselVoc = getDieselVOCPerVMT(truckSpeed);

      combiDieselVehicleEmissions.co.total += dieselCO * vmtCombi;
      combiDieselVehicleEmissions.co[timePeriod] += dieselCO * vmtCombi;
      combiDieselVehicleEmissions.co2.total += dieselCO2 * vmtCombi;
      combiDieselVehicleEmissions.co2[timePeriod] += dieselCO2 * vmtCombi;
      combiDieselVehicleEmissions.nox.total += dieselNox * vmtCombi;
      combiDieselVehicleEmissions.nox[timePeriod] += dieselNox * vmtCombi;
      combiDieselVehicleEmissions.pm2_5.total += dieselPm2_5 * vmtCombi;
      combiDieselVehicleEmissions.pm2_5[timePeriod] += dieselPm2_5 * vmtCombi;
      combiDieselVehicleEmissions.pm10.total += dieselPm10 * vmtCombi;
      combiDieselVehicleEmissions.pm10[timePeriod] += dieselPm10 * vmtCombi;
      combiDieselVehicleEmissions.voc.total += dieselVoc * vmtCombi;
      combiDieselVehicleEmissions.voc[timePeriod] += dieselVoc * vmtCombi;

      singlDieselVehicleEmissions.co.total += dieselCO * vmtSingl;
      singlDieselVehicleEmissions.co[timePeriod] += dieselCO * vmtSingl;
      singlDieselVehicleEmissions.co2.total += dieselCO2 * vmtSingl;
      singlDieselVehicleEmissions.co2[timePeriod] += dieselCO2 * vmtSingl;
      singlDieselVehicleEmissions.nox.total += dieselNox * vmtSingl;
      singlDieselVehicleEmissions.nox[timePeriod] += dieselNox * vmtSingl;
      singlDieselVehicleEmissions.pm2_5.total += dieselPm2_5 * vmtSingl;
      singlDieselVehicleEmissions.pm2_5[timePeriod] += dieselPm2_5 * vmtSingl;
      singlDieselVehicleEmissions.pm10.total += dieselPm10 * vmtSingl;
      singlDieselVehicleEmissions.pm10[timePeriod] += dieselPm10 * vmtSingl;
      singlDieselVehicleEmissions.voc.total += dieselVoc * vmtSingl;
      singlDieselVehicleEmissions.voc[timePeriod] += dieselVoc * vmtSingl;
    }

    co2Emissions.truck = Object.keys(co2Emissions.singl).reduce(
      (acc, timePeriod) => {
        acc[timePeriod] =
          co2Emissions.singl[timePeriod] + co2Emissions.combi[timePeriod];
        return acc;
      },
      {},
    );

    const truckDieselVehicleEmissions = Object.keys(
      singlDieselVehicleEmissions,
    ).reduce((acc, eType) => {
      acc[eType] = Object.keys(singlDieselVehicleEmissions[eType]).reduce(
        (acc2, tBin) => {
          acc2[tBin] =
            singlDieselVehicleEmissions[eType][tBin] +
            combiDieselVehicleEmissions[eType][tBin];
          return acc2;
        },
        {},
      );
      return acc;
    }, {});

    // WARNING: MUTATIONS
    // Convert the units to metric tonnes.
    //   Formulas provided by NYSDOT are for grams.
    Object.keys(co2Emissions).forEach((vehClass) => {
      Object.keys(co2Emissions[vehClass]).forEach((timePeriod) => {
        co2Emissions[vehClass][timePeriod] /= 1000000;
      });
    });

    [
      passGasolineVehicleEmissions,
      combiDieselVehicleEmissions,
      singlDieselVehicleEmissions,
      truckDieselVehicleEmissions,
    ].forEach((emissionsObj) =>
      Object.keys(emissionsObj).forEach((eType) => {
        Object.keys(emissionsObj[eType]).forEach((tBin) => {
          emissionsObj[eType][tBin] /= 1000000;
        });
      }),
    );

    return this.outputFormatter({
      tmc,
      co2Emissions,
      passGasolineVehicleEmissions,
      combiDieselVehicleEmissions,
      singlDieselVehicleEmissions,
      truckDieselVehicleEmissions,
    });
  }
}

EmissionsCalculator.measure = EMISSIONS;

EmissionsCalculator.configDefaults = {};
EmissionsCalculator.configOptions = {};

module.exports = EmissionsCalculator;
