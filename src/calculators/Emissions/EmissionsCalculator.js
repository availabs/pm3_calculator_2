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

const getPassengerVehicleCO2ForSpeed = require('./getPassengerVehicleCO2ForSpeed');
const getFreightTruckCO2ForSpeed = require('./getFreightTruckCO2ForSpeed');

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

    const co2Emissions = {
      pass: ['total', ...timePeriodNames].reduce((acc, timePeriod) => {
        acc[timePeriod] = 0;
        return acc;
      }, {}),
      singl: ['total', ...timePeriodNames].reduce((acc, timePeriod) => {
        acc[timePeriod] = 0;
        return acc;
      }, {}),
      combi: ['total', ...timePeriodNames].reduce((acc, timePeriod) => {
        acc[timePeriod] = 0;
        return acc;
      }, {}),
    };

    for (let i = 0; i < data.length; ++i) {
      const row = data[i];

      assert.strictEqual(row.tmc, attrs.tmc);

      const timePeriod = this.timePeriodIdentifier(row);

      const { [speedAllVehicles]: allSpeed, dow, month, timeBinNum } = row;

      const {
        [speedPassengerVehicles]: passSpeed = allSpeed,
        [speedFreighTrucks]: truckSpeed = allSpeed,
      } = row;

      assert(!_.isNil(speedAllVehicles));
      assert(!_.isNil(speedFreighTrucks));

      const fractionOfDailyAadt =
        fractionOfDailyAadtByMonthByDowByTimeBin[month][dow][timeBinNum];

      const [vmtPass, vmtSingl, vmtCombi] = [
        passDirAadt,
        singlDirAadt,
        combiDirAadt,
      ].map((dirAadt) => dirAadt * fractionOfDailyAadt * miles);

      const passCO2 = getPassengerVehicleCO2ForSpeed(passSpeed);
      const truckCO2 = getFreightTruckCO2ForSpeed(truckSpeed);

      co2Emissions.pass.total += passCO2 * vmtPass;
      co2Emissions.pass[timePeriod] += passCO2 * vmtPass;

      co2Emissions.singl.total += truckCO2 * vmtSingl;
      co2Emissions.singl[timePeriod] += truckCO2 * vmtSingl;

      co2Emissions.combi.total += truckCO2 * vmtCombi;
      co2Emissions.combi[timePeriod] += truckCO2 * vmtCombi;
    }

    co2Emissions.truck = Object.keys(co2Emissions.singl).reduce(
      (acc, timePeriod) => {
        acc[timePeriod] =
          co2Emissions.singl[timePeriod] + co2Emissions.combi[timePeriod];
        return acc;
      },
      {},
    );

    return this.outputFormatter({
      tmc,
      co2Emissions,
    });
  }
}

EmissionsCalculator.measure = EMISSIONS;

EmissionsCalculator.configDefaults = {};
EmissionsCalculator.configOptions = {};

module.exports = EmissionsCalculator;
