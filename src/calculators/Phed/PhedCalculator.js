const assert = require('assert');

const { mapValues, pick } = require('lodash');

const {
  getFractionOfDailyAadtByDowByTimeBin
} = require('../../storage/daos/TrafficDistributionProfilesDao');

const {
  AVAIL,
  CATTLAB
} = require('../../enums/trafficDistributionProfilesVersions');

const { ARITHMETIC, HARMONIC } = require('../../enums/meanTypes');
const { TRAVEL_TIME, SPEED } = require('../../enums/npmrdsMetrics');
const { IDENTITY } = require('../../enums/outputFormats');

const { precisionRound } = require('../../utils/MathUtils');
const { union } = require('../../utils/SetUtils');

const TrafficDistributionFactorsCalculator = require('../TrafficDistributionFactors/TrafficDistributionFactorsCalculator');

const createTimePeriodIdentifier = require('../timePeriods/createTimePeriodIdentifier');
const { listTimePeriodsInSpec } = require('../timePeriods/timePeriodUtils');

const { getNpmrdsDataKey } = require('../../utils/NpmrdsDataKey');

const npmrdsDataSourcesEnum = require('../../enums/npmrdsDataSources');

const npmrdsDataSources = Object.keys(npmrdsDataSourcesEnum);
const { ALL, PASS, TRUCK } = npmrdsDataSourcesEnum;

const {
  names: timePeriodSpecNamesEnum,
  specs: generalTimePeriodSpecs
} = require('../timePeriods/TimePeriodSpecs');

const timePeriodSpecNames = Object.keys(timePeriodSpecNamesEnum);

const { AMP, PMP } = require('../../enums/pm3TimePeriods');

const {
  MEASURE_DEFAULT_TIME_PERIOD_SPEC,
  PM3_TIME_PERIOD_SPEC
} = timePeriodSpecNamesEnum;

const defaultTimePeriodSpec = pick(
  generalTimePeriodSpecs[PM3_TIME_PERIOD_SPEC],
  [AMP, PMP]
);

const outputFormatters = require('./PhedOutputFormatters');

const PHED = 'PHED';
const SEC_PER_MINUTE = 60;

const vehClass2DirAadtTypes = {
  [ALL]: ['directionalAadt'],
  [PASS]: ['directionalAadtPass'],
  [TRUCK]: [
    'directionalAadtSingl',
    'directionalAadtCombi',
    'directionalAadtTruck'
  ]
};

function getDirAadtByVehClass(attrs) {
  return this.vehClassDirAadtTypes.reduce((acc, vehClassDirAadtType) => {
    const vehClass =
      vehClassDirAadtType.replace(/directionalAadt/, '').toLowerCase() || 'all';

    acc[vehClass] = attrs[vehClassDirAadtType];
    return acc;
  }, {});
}

function getAvgVehicleOccupancyByVehClass(attrs) {
  return this.avgVehcleOccupancyTypes.reduce((acc, avgVehcleOccupancyType) => {
    const vehClass =
      avgVehcleOccupancyType.replace(/avgVehicleOccupancy/, '').toLowerCase() ||
      'all';

    acc[vehClass] = attrs[avgVehcleOccupancyType];
    return acc;
  }, {});
}

function getXDelayHrs(metricValue) {
  const {
    timeBinSize,
    isSpeedBased,
    roundTravelTimes,
    miles,
    thresholdTravelTimeSec
  } = this;

  const ttReal = isSpeedBased ? (miles / metricValue) * 3600 : metricValue;

  const tt = roundTravelTimes ? precisionRound(ttReal) : ttReal;

  // TODO: Document the nuances of switching npmrdsMetrics
  const xds = roundTravelTimes
    ? precisionRound(tt - thresholdTravelTimeSec)
    : tt - thresholdTravelTimeSec;

  const xDelaySec = Math.min(xds, SEC_PER_MINUTE * timeBinSize);

  const xdh = xDelaySec / 3600;
  const xDelayHrs = roundTravelTimes ? precisionRound(xdh, 3) : xdh;

  return Math.max(xDelayHrs, 0);
}

function getXDelayVehHrsByVehClass({ dow, timeBinNum, xDelayHrs }) {
  const {
    roundTravelTimes,
    dirAadtByVehClass,
    fractionOfDailyAadtByDowByTimeBin
  } = this;
  const fractionOfDailyAadt =
    fractionOfDailyAadtByDowByTimeBin[dow][timeBinNum];

  const xDelayVehHrsByVehClass = mapValues(dirAadtByVehClass, dirAadt => {
    const trafficVol = roundTravelTimes
      ? precisionRound(dirAadt * fractionOfDailyAadt, 1)
      : dirAadt * fractionOfDailyAadt;

    return xDelayHrs * trafficVol;
  });

  return xDelayVehHrsByVehClass;
}

function createAccumulatorVariables() {
  const { vehicleClasses, timePeriods } = this;

  return {
    xDelayHrsByTimePeriod: timePeriods.reduce((acc, timePeriod) => {
      acc[timePeriod] = 0;
      return acc;
    }, {}),

    xDelayVehHrsByVehClassByTimePeriod: timePeriods.reduce(
      (acc, timePeriod) => {
        acc[timePeriod] = {};
        vehicleClasses.forEach(vehClass => {
          acc[timePeriod][vehClass] = 0;
        });
        return acc;
      },
      {}
    ),

    totalXDelayVehHrsByVehClass: vehicleClasses.reduce((acc, vehClass) => {
      acc[vehClass] = 0;
      return acc;
    }, {})
  };
}

function getXDelayPerHrsByVehClassByTimePeriod(
  xDelayVehHrsByVehClassByTimePeriod
) {
  const {
    timePeriods,
    roundTravelTimes,
    vehicleClasses,
    avgVehicleOccupancyByVehClass
  } = this;
  return timePeriods.reduce((acc, timePeriod) => {
    const xDelayVehHrsByVehClass =
      xDelayVehHrsByVehClassByTimePeriod[timePeriod];

    acc[timePeriod] = {};

    vehicleClasses.forEach(vehClass => {
      const xDelayVehHrs = xDelayVehHrsByVehClass[vehClass];
      const avo = avgVehicleOccupancyByVehClass[vehClass];

      acc[timePeriod][vehClass] = roundTravelTimes
        ? precisionRound(xDelayVehHrs * avo, 3)
        : xDelayVehHrs * avo;
    });

    return acc;
  }, {});
}

function getTotalXDelayPerHrsByVehClass(totalXDelayVehHrsByVehClass) {
  const { vehicleClasses, avgVehicleOccupancyByVehClass } = this;
  return vehicleClasses.reduce((acc, vehClass) => {
    const avo = avgVehicleOccupancyByVehClass[vehClass];
    const xDelayVehHrs = totalXDelayVehHrsByVehClass[vehClass];

    acc[vehClass] = avo * xDelayVehHrs;

    return acc;
  }, {});
}

class PhedCalculator {
  constructor(calcConfigParams) {
    this.year = calcConfigParams.year;
    this.meanType = calcConfigParams.meanType;
    this.timeBinSize = calcConfigParams.timeBinSize;

    this.outputFormatter = outputFormatters[calcConfigParams.outputFormat].bind(
      this
    );

    Object.keys(PhedCalculator.configDefaults).forEach(k => {
      this[k] =
        calcConfigParams[k] === undefined
          ? PhedCalculator.configDefaults[k]
          : calcConfigParams[k];
    });

    const timePeriodSpecDef =
      this.timePeriodSpec === MEASURE_DEFAULT_TIME_PERIOD_SPEC
        ? defaultTimePeriodSpec
        : generalTimePeriodSpecs[this.timePeriodSpec];

    this.timePeriodSpecDef = timePeriodSpecDef;
    this.timePeriodIdentifier = createTimePeriodIdentifier(timePeriodSpecDef);
    this.timePeriods = listTimePeriodsInSpec(timePeriodSpecDef);

    this.trafficDistributionFactorsCalculator = new TrafficDistributionFactorsCalculator(
      Object.assign({}, calcConfigParams, { outputFormat: IDENTITY })
    );

    this.vehClassDirAadtTypes = vehClass2DirAadtTypes[this.npmrdsDataSource];

    this.avgVehcleOccupancyTypes = this.vehClassDirAadtTypes.map(t =>
      t.replace(/directionalAadt/, 'avgVehicleOccupancy')
    );

    this.requiredTmcMetadata = union(
      ['avgSpeedlimit', 'miles', 'functionalClass', 'avgVehicleOccupancy'],
      this.vehClassDirAadtTypes,
      this.trafficDistributionFactorsCalculator.requiredTmcMetadata
    );

    this.npmrdsDataKeys = [getNpmrdsDataKey(this)];

    this.isSpeedBased = this.npmrdsMetric === SPEED;
  }

  async calculateForTmc({ data, attrs }) {
    const {
      npmrdsDataKeys: [npmrdsDataKey],
      timeBinSize,
      trafficDistributionTimeBinSize,
      trafficDistributionProfilesVersion,
      roundTravelTimes,
      isSpeedBased,
      timePeriods
    } = this;

    const { tmc, avgSpeedlimit, functionalClass, miles } = attrs;

    const dirAadtByVehClass = getDirAadtByVehClass.call(this, attrs);

    const avgVehicleOccupancyByVehClass = getAvgVehicleOccupancyByVehClass.call(
      this,
      attrs
    );

    const vehicleClasses = Object.keys(dirAadtByVehClass);

    const {
      congestionLevel,
      directionality
    } = await this.trafficDistributionFactorsCalculator.calculateForTmc({
      data,
      attrs
    });

    const fractionOfDailyAadtByDowByTimeBin = await getFractionOfDailyAadtByDowByTimeBin(
      {
        functionalClass,
        congestionLevel,
        directionality,
        trafficDistributionProfilesVersion,
        trafficDistributionTimeBinSize,
        timeBinSize
      }
    );

    const thresholdSpeed = Math.max(avgSpeedlimit * 0.6, 20);

    // mi / mi/hr * sec/hr == mi * hr/mi * sec/hr == hr * sec/hr == sec
    const thresholdTravelTimeSec = roundTravelTimes
      ? precisionRound((precisionRound(miles, 3) / thresholdSpeed) * 3600)
      : (miles / thresholdSpeed) * 3600;

    const tmcCalcCtx = {
      timeBinSize,
      isSpeedBased,
      roundTravelTimes,
      miles,
      thresholdTravelTimeSec,
      dirAadtByVehClass,
      fractionOfDailyAadtByDowByTimeBin,
      vehicleClasses,
      avgVehicleOccupancyByVehClass,
      timePeriods
    };

    // The accumulator variables...
    const {
      xDelayHrsByTimePeriod,
      xDelayVehHrsByVehClassByTimePeriod,
      totalXDelayVehHrsByVehClass
    } = createAccumulatorVariables.call(tmcCalcCtx);

    let totalXDelayHrs = 0;

    // Loop over the data and update the accumulator varaibles
    for (let i = 0; i < data.length; ++i) {
      const row = data[i];

      assert.strictEqual(row.tmc, attrs.tmc);

      const timePeriod = this.timePeriodIdentifier(row);

      if (timePeriod) {
        const { [npmrdsDataKey]: metricValue, dow, timeBinNum } = row;

        const xDelayHrs = getXDelayHrs.call(tmcCalcCtx, metricValue);

        xDelayHrsByTimePeriod[timePeriod] += xDelayHrs;

        totalXDelayHrs += xDelayHrs;

        const xDelayVehHrsByVehClass = getXDelayVehHrsByVehClass.call(
          tmcCalcCtx,
          {
            dow,
            timeBinNum,
            xDelayHrs
          }
        );

        for (let j = 0; j < vehicleClasses.length; ++j) {
          const vehClass = vehicleClasses[j];
          const xDelayVehHrs = xDelayVehHrsByVehClass[vehClass];

          xDelayVehHrsByVehClassByTimePeriod[timePeriod][
            vehClass
          ] += xDelayVehHrs;

          totalXDelayVehHrsByVehClass[vehClass] += xDelayVehHrs;
        }
      }
    }

    const xDelayPerHrsByVehClassByTimePeriod = getXDelayPerHrsByVehClassByTimePeriod.call(
      tmcCalcCtx,
      xDelayVehHrsByVehClassByTimePeriod
    );

    const totalXDelayPerHrsByVehClass = getTotalXDelayPerHrsByVehClass.call(
      tmcCalcCtx,
      totalXDelayVehHrsByVehClass
    );

    return this.outputFormatter({
      tmc,
      miles,
      npmrdsDataKey,
      avgSpeedlimit,
      thresholdSpeed,
      thresholdTravelTimeSec,
      congestionLevel,
      directionality,
      functionalClass,
      dirAadtByVehClass,
      avgVehicleOccupancyByVehClass,
      xDelayHrsByTimePeriod,
      totalXDelayHrs,
      xDelayVehHrsByVehClassByTimePeriod,
      totalXDelayVehHrsByVehClass,
      xDelayPerHrsByVehClassByTimePeriod,
      totalXDelayPerHrsByVehClass
    });
  }
}

PhedCalculator.measure = PHED;

PhedCalculator.configDefaults = {
  meanType: ARITHMETIC,
  npmrdsDataSource: ALL,
  npmrdsMetric: TRAVEL_TIME,
  timePeriodSpec: MEASURE_DEFAULT_TIME_PERIOD_SPEC,
  trafficDistributionTimeBinSize: 60,
  trafficDistributionProfilesVersion: CATTLAB,
  roundTravelTimes: true
};
PhedCalculator.configOptions = {
  meanType: [ARITHMETIC, HARMONIC],
  npmrdsDataSource: npmrdsDataSources,
  npmrdsMetric: [TRAVEL_TIME, SPEED],
  timePeriodSpec: timePeriodSpecNames,
  trafficDistributionTimeBinSize: [5, 15, 60],
  trafficDistributionProfilesVersion: [AVAIL, CATTLAB],
  roundTravelTimes: [true, false]
};
PhedCalculator.defaultTimePeriodSpec = defaultTimePeriodSpec;

module.exports = PhedCalculator;
