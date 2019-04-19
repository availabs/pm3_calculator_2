const { range } = require('lodash');
const { cartesianProduct, union } = require('../../utils/SetUtils');

const createTimePeriodIdentifier = require('./createTimePeriodIdentifier');
const PM3TimePeriodSpec = require('./TimePeriodSpecs/PM3TimePeriodSpec');
const TotalTimePeriodSpec = require('./TimePeriodSpecs/TotalTimePeriodSpec');

test('PM3 TimePeriodSpec', () => {
  const timePeriodIdentifier = createTimePeriodIdentifier(PM3TimePeriodSpec);

  const amp = cartesianProduct(range(1, 6), union(range(6, 10))).map(
    ([dow, hour]) => ({ dow, hour })
  );

  const midd = cartesianProduct(range(1, 6), union(range(10, 16))).map(
    ([dow, hour]) => ({ dow, hour })
  );

  const pmp = cartesianProduct(range(1, 6), union(range(16, 20))).map(
    ([dow, hour]) => ({ dow, hour })
  );

  const we = cartesianProduct([0, 6], union(range(6, 20))).map(
    ([dow, hour]) => ({ dow, hour })
  );

  const ovn = cartesianProduct(range(7), union(range(6), range(20, 24))).map(
    ([dow, hour]) => ({ dow, hour })
  );

  amp.forEach(d => expect(timePeriodIdentifier(d)).toBe('AMP'));
  midd.forEach(d => expect(timePeriodIdentifier(d)).toBe('MIDD'));
  pmp.forEach(d => expect(timePeriodIdentifier(d)).toBe('PMP'));
  we.forEach(d => expect(timePeriodIdentifier(d)).toBe('WE'));
  ovn.forEach(d => expect(timePeriodIdentifier(d)).toBe('OVN'));
});

test('TotalTimePeriodSpec', () => {
  const timePeriodIdentifier = createTimePeriodIdentifier(TotalTimePeriodSpec);

  const total = cartesianProduct(range(7), range(24)).map(([dow, hour]) => ({
    dow,
    hour
  }));

  total.forEach(d => expect(timePeriodIdentifier(d)).toBe('TOTAL'));
});
