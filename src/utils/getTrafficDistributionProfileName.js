const { WEEKDAY } = require('../enums/dayTypes');

module.exports = ({
  dayType,
  congestionLevel,
  directionality,
  functionalClass
}) =>
  dayType === WEEKDAY
    ? `${dayType}_${congestionLevel}_${directionality}_${functionalClass}`
    : `${dayType}_${functionalClass}`;
