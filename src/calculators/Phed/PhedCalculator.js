const assert = require('assert');
// const { createWriteStream } = require('fs');
// const { join } = require('path');

// const { sync: mkdirpSync } = require('mkdirp');

const { mapValues } = require('lodash');

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

const {
  MEASURE_DEFAULT_TIME_PERIOD_SPEC,
  PM3_ALT_PEAKS_TIME_PERIOD_SPEC
} = timePeriodSpecNamesEnum;

const defaultTimePeriodSpec =
  generalTimePeriodSpecs[PM3_ALT_PEAKS_TIME_PERIOD_SPEC];

const outputFormatters = require('./PhedOutputFormatters');

const PHED = 'PHED';
const SEC_PER_MINUTE = 60;

// const debugLogDir = join(__dirname, '../../../phed_debug_logs');

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

const getXDelayHrs = (tmcCalcCtx, metricValue) => {
  const {
    timeBinSize,
    isSpeedBased,
    roundTravelTimes,
    miles,
    thresholdTravelTimeSec
  } = tmcCalcCtx;

  const ttReal = isSpeedBased ? (miles / metricValue) * 3600 : metricValue;

  const tt = roundTravelTimes ? precisionRound(ttReal) : ttReal;

  // TODO: Document the nuances of switching npmrdsMetrics
  const xds = roundTravelTimes
    ? precisionRound(tt - thresholdTravelTimeSec)
    : tt - thresholdTravelTimeSec;

  const xdelaySec = Math.min(xds, SEC_PER_MINUTE * timeBinSize);

  const xdh = xdelaySec / 3600;
  const xdelayHrs = roundTravelTimes ? precisionRound(xdh, 3) : xdh;

  return Math.max(xdelayHrs, 0);
};

const getXDelayVehHrsByVehClass = (
  tmcCalcCtx,
  { dow, timeBinNum, xdelayHrs }
) => {
  const {
    roundTravelTimes,
    dirAadtByVehClass,
    fractionOfDailyAadtByDowByTimeBin
  } = tmcCalcCtx;

  const fractionOfDailyAadt =
    fractionOfDailyAadtByDowByTimeBin[dow][timeBinNum];

  const xdelayVehHrsByVehClass = mapValues(dirAadtByVehClass, dirAadt => {
    const trafficVol = roundTravelTimes
      ? precisionRound(dirAadt * fractionOfDailyAadt, 1)
      : dirAadt * fractionOfDailyAadt;

    return xdelayHrs * trafficVol;
  });

  return xdelayVehHrsByVehClass;
};

const createAccumulatorVariables = tmcCalcCtx => {
  const { vehicleClasses, timePeriods } = tmcCalcCtx;

  return {
    xdelayHrsByTimePeriod: timePeriods.reduce((acc, timePeriod) => {
      acc[timePeriod] = 0;
      return acc;
    }, {}),

    xdelayVehHrsByVehClassByTimePeriod: timePeriods.reduce(
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
};

const getXDelayPerHrsByVehClassByTimePeriod = (
  tmcCalcCtx,
  xdelayVehHrsByVehClassByTimePeriod
) => {
  const {
    timePeriods,
    roundTravelTimes,
    vehicleClasses,
    avgVehicleOccupancyByVehClass
  } = tmcCalcCtx;

  return timePeriods.reduce((acc, timePeriod) => {
    const xdelayVehHrsByVehClass =
      xdelayVehHrsByVehClassByTimePeriod[timePeriod];

    acc[timePeriod] = {};

    vehicleClasses.forEach(vehClass => {
      const xdelayVehHrs = xdelayVehHrsByVehClass[vehClass];
      const avo = avgVehicleOccupancyByVehClass[vehClass];

      acc[timePeriod][vehClass] = roundTravelTimes
        ? precisionRound(xdelayVehHrs * avo, 3)
        : xdelayVehHrs * avo;
    });

    return acc;
  }, {});
};

const getTotalXDelayPerHrsByVehClass = (
  tmcCalcCtx,
  totalXDelayVehHrsByVehClass
) => {
  const {
    roundTravelTimes,
    vehicleClasses,
    avgVehicleOccupancyByVehClass
  } = tmcCalcCtx;

  return vehicleClasses.reduce((acc, vehClass) => {
    const avo = avgVehicleOccupancyByVehClass[vehClass];
    const xdelayVehHrs = totalXDelayVehHrsByVehClass[vehClass];

    acc[vehClass] = roundTravelTimes
      ? precisionRound(avo * xdelayVehHrs, 3)
      : avo * xdelayVehHrs;

    return acc;
  }, {});
};

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
    data.sort(
      (a, b) => a.date.localeCompare(b.date) || a.timeBinNum - b.timeBinNum
    );

    const {
      npmrdsDataKeys: [npmrdsDataKey],
      timeBinSize,
      trafficDistributionTimeBinSize,
      trafficDistributionProfilesVersion,
      roundTravelTimes,
      isSpeedBased,
      timePeriods
      // year
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
      xdelayHrsByTimePeriod,
      xdelayVehHrsByVehClassByTimePeriod,
      totalXDelayVehHrsByVehClass
    } = createAccumulatorVariables(tmcCalcCtx);

    let totalXDelayHrs = 0;

    // Loop over the data and update the accumulator varaibles
    for (let i = 0; i < data.length; ++i) {
      const row = data[i];

      assert.strictEqual(row.tmc, attrs.tmc);

      const timePeriod = this.timePeriodIdentifier(row);

      if (timePeriod) {
        const { [npmrdsDataKey]: metricValue, dow, timeBinNum } = row;

        const xdelayHrs = getXDelayHrs(tmcCalcCtx, metricValue);

        xdelayHrsByTimePeriod[timePeriod] += xdelayHrs;

        totalXDelayHrs += xdelayHrs;

        const xdelayVehHrsByVehClass = getXDelayVehHrsByVehClass(tmcCalcCtx, {
          dow,
          timeBinNum,
          xdelayHrs
        });

        for (let j = 0; j < vehicleClasses.length; ++j) {
          const vehClass = vehicleClasses[j];
          const xdelayVehHrs = xdelayVehHrsByVehClass[vehClass];

          xdelayVehHrsByVehClassByTimePeriod[timePeriod][
            vehClass
          ] += xdelayVehHrs;

          totalXDelayVehHrsByVehClass[vehClass] += xdelayVehHrs;
        }
      }
    }

    const xdelayPerHrsByVehClassByTimePeriod = getXDelayPerHrsByVehClassByTimePeriod(
      tmcCalcCtx,
      xdelayVehHrsByVehClassByTimePeriod
    );

    const totalXDelayPerHrsByVehClass = getTotalXDelayPerHrsByVehClass(
      tmcCalcCtx,
      totalXDelayVehHrsByVehClass
    );

    // NOTE: The final rule does not say to round the product of the
    //       excessiveDelay and the traffic volume with in the summation,
    //       nor their sum, before multiplying by the AVO.
    //       Additionally, it does not state to round the AVO.
    //       For these reasons, we save the rounding of xdelayVehHrsByVehClassByTimePeriod
    //       until after we calculate xdelayPerHrsByVehClassByTimePeriod.

    Object.keys(xdelayVehHrsByVehClassByTimePeriod).forEach(timePeriod => {
      const xdelayVehHrsByVehClass =
        xdelayVehHrsByVehClassByTimePeriod[timePeriod];

      Object.keys(xdelayVehHrsByVehClass).forEach(vehClass => {
        xdelayVehHrsByVehClass[vehClass] = precisionRound(
          xdelayVehHrsByVehClass[vehClass],
          3
        );
      });
    });

    Object.keys(totalXDelayVehHrsByVehClass).forEach(vehClass => {
      totalXDelayVehHrsByVehClass[vehClass] = precisionRound(
        totalXDelayVehHrsByVehClass[vehClass],
        3
      );
    });

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
      xdelayHrsByTimePeriod,
      xdelayHrs: totalXDelayHrs,
      xdelayVehHrsByVehClassByTimePeriod,
      xdelayVehHrsByVehClass: totalXDelayVehHrsByVehClass,
      xdelayPerHrsByVehClassByTimePeriod,
      xdelayPerHrsByVehClass: totalXDelayPerHrsByVehClass
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
  // logIntermediaryCalculations: 0
};
PhedCalculator.configOptions = {
  meanType: [ARITHMETIC, HARMONIC],
  npmrdsDataSource: npmrdsDataSources,
  npmrdsMetric: [TRAVEL_TIME, SPEED],
  timePeriodSpec: timePeriodSpecNames,
  trafficDistributionTimeBinSize: [5, 15, 60],
  trafficDistributionProfilesVersion: [AVAIL, CATTLAB],
  roundTravelTimes: [true, false]
  // logIntermediaryCalculations: [0, 1]
};

PhedCalculator.defaultTimePeriodSpec = defaultTimePeriodSpec;

module.exports = PhedCalculator;
