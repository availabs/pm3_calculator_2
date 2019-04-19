const assert = require('assert');

const { map, mapValues, pick, reduce, sum } = require('lodash');

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
          : calcConfigParams[k] === undefined;
    });

    const timePeriodSpecDef =
      this.timePeriodSpec === MEASURE_DEFAULT_TIME_PERIOD_SPEC
        ? defaultTimePeriodSpec
        : generalTimePeriodSpecs[this.timePeriodSpec];

    this.timePeriodSpecDef = timePeriodSpecDef;
    this.timePeriodIdentifier = createTimePeriodIdentifier(timePeriodSpecDef);

    this.trafficDistributionFactorsCalculator = new TrafficDistributionFactorsCalculator(
      Object.assign({}, calcConfigParams, { outputFormat: IDENTITY })
    );

    this.vehClassDirAadtTypes = {
      [ALL]: ['directionalAadt'],
      [PASS]: ['directionalAadtPass'],
      [TRUCK]: [
        'directionalAadtSingl',
        'directionalAadtCombi',
        'directionalAadtTruck'
      ]
    }[this.npmrdsDataSource];

    this.avgVehcleOccupancyTypes = this.vehClassDirAadtTypes.map(t =>
      t.replace(/directionalAadt/, 'avgVehicleOccupancy')
    );

    this.requiredTmcMetadata = union(
      ['avgSpeedlimit', 'miles', 'functionalClass', 'avgVehicleOccupancy'],
      this.vehClassDirAadtTypes,
      this.trafficDistributionFactorsCalculator.requiredTmcMetadata
    );

    this.npmrdsDataKeys = [getNpmrdsDataKey(this)];
  }

  async calculateForTmc({ data, attrs }) {
    const {
      npmrdsMetric,
      vehClassDirAadtTypes,
      avgVehcleOccupancyTypes,
      npmrdsDataKeys: [npmrdsDataKey],
      timeBinSize,
      trafficDistributionTimeBinSize,
      trafficDistributionProfilesVersion,
      roundTravelTimes
    } = this;

    const { tmc, avgSpeedlimit, functionalClass, miles } = attrs;

    const dirAadtByVehClass = vehClassDirAadtTypes.reduce(
      (acc, vehClassDirAadtType) => {
        const vehClass =
          vehClassDirAadtType.replace(/directionalAadt/, '').toLowerCase() ||
          'all';

        acc[vehClass] = attrs[vehClassDirAadtType];
        return acc;
      },
      {}
    );

    const avgVehicleOccupancyByVehClass = avgVehcleOccupancyTypes.reduce(
      (acc, avgVehcleOccupancyType) => {
        const vehClass =
          avgVehcleOccupancyType
            .replace(/avgVehicleOccupancy/, '')
            .toLowerCase() || 'all';

        acc[vehClass] = attrs[avgVehcleOccupancyType];
        return acc;
      },
      {}
    );

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

    const isSpeedBased = npmrdsMetric === SPEED;

    const thresholdSpeed = Math.max(avgSpeedlimit * 0.6, 20);

    // mi / mi/hr * sec/hr == mi * hr/mi * sec/hr == hr * sec/hr == sec
    const thresholdTravelTimeSec = roundTravelTimes
      ? precisionRound((precisionRound(miles, 3) / thresholdSpeed) * 3600)
      : (miles / thresholdSpeed) * 3600;

    const xDelaysByTimePeriod = data.reduce((acc, row) => {
      assert.strictEqual(row.tmc, attrs.tmc);

      const { [npmrdsDataKey]: metricValue, date, dow, timeBinNum } = row;

      const timePeriod = this.timePeriodIdentifier(row);

      if (!timePeriod) {
        // console.log(JSON.stringify(row, null, 4));
        return acc;
      }

      acc[timePeriod] = acc[timePeriod] || [];

      const ttReal = isSpeedBased ? (miles / metricValue) * 3600 : metricValue;
      const tt = roundTravelTimes ? precisionRound(ttReal) : ttReal;

      // TODO: Document the nuances of switching npmrdsMetrics
      const xDelaySec = Math.min(
        tt - thresholdTravelTimeSec,
        SEC_PER_MINUTE * timeBinSize
      );

      const xdh = xDelaySec / 3600;
      const xDelayHrs = roundTravelTimes ? precisionRound(xdh, 3) : xdh;

      if (xDelayHrs > 0) {
        const fractionOfDailyAadt =
          fractionOfDailyAadtByDowByTimeBin[dow][timeBinNum];

        const xDelayVehHrsByVehClass = mapValues(
          dirAadtByVehClass,
          vehClassDirAadt => xDelayHrs * vehClassDirAadt * fractionOfDailyAadt
        );

        const d = {
          date,
          timeBinNum,
          tt,
          xDelaySec,
          fractionOfDailyAadt,
          xDelayHrs,
          xDelayVehHrsByVehClass
        };

        acc[timePeriod].push(d);
      }

      return acc;
    }, {});

    const totalXDelayByTimePeriod = mapValues(xDelaysByTimePeriod, xDelays => {
      const xDelayHrsTotal = sum(map(xDelays, 'xDelayHrs'));

      const xDelayVehHrsByVehClassTotal = xDelays
        .map(({ xDelayVehHrsByVehClass }) => xDelayVehHrsByVehClass)
        .reduce((acc, xDelayVehHrsByVehClass) => {
          Object.keys(xDelayVehHrsByVehClass).forEach(vehClass => {
            acc[vehClass] = acc[vehClass] || 0;
            acc[vehClass] += xDelayVehHrsByVehClass[vehClass];
          });

          return acc;
        }, {});

      return {
        xDelayHrsTotal,
        xDelayVehHrsByVehClassTotal
      };
    });

    const { totalXDelayHrs, totalXDelayVehHrsByVehClass } = Object.keys(
      totalXDelayByTimePeriod
    ).reduce(
      (acc, timePeriod) => {
        const {
          xDelayHrsTotal,
          xDelayVehHrsByVehClassTotal
        } = totalXDelayByTimePeriod[timePeriod];
        acc.totalXDelayHrs += xDelayHrsTotal;

        Object.keys(xDelayVehHrsByVehClassTotal).forEach(vehClass => {
          acc.totalXDelayVehHrsByVehClass[vehClass] =
            acc.totalXDelayVehHrsByVehClass[vehClass] || 0;
          acc.totalXDelayVehHrsByVehClass[vehClass] +=
            xDelayVehHrsByVehClassTotal[vehClass];
        });

        return acc;
      },
      { totalXDelayHrs: 0, totalXDelayVehHrsByVehClass: {} }
    );

    const totalXDelayPerHrsByVehClass = reduce(
      totalXDelayVehHrsByVehClass,
      (acc, v, k) => {
        acc[k] = v * avgVehicleOccupancyByVehClass[k];
        return acc;
      },
      {}
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
      totalXDelayByTimePeriod,
      totalXDelayHrs,
      totalXDelayVehHrsByVehClass,
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
