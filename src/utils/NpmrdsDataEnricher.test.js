const { shuffle } = require('lodash');

const NpmrdsDataEnricher = require('./NpmrdsDataEnricher');
const { getDaylightSavingsStartDateForYear } = require('./TimeUtils');

const YEAR = 2017;

const timeBinSizes = [5, 15, 60];

const TWO_AM_MINS = 120;
const THREE_AM_MINS = 180;

describe.each(timeBinSizes)('Time Bin Size %d', timeBinSize => {
  test(`Test dow enricher -- Complete`, () => {
    const {
      month: dlsMonth,
      date: dlsDate
    } = getDaylightSavingsStartDateForYear(YEAR);

    const dlsStartTimeBinNum = TWO_AM_MINS / timeBinSize;

    const curTime = new Date(`${YEAR}-01-01 00:00:00`);
    const endTime = new Date(`${YEAR + 1}-01-01 00:00:00`);

    const mockNpmrdsData = [];

    while (curTime < endTime) {
      const yyyy = curTime.getFullYear();
      const mm = `0${curTime.getMonth() + 1}`.slice(-2);
      const dd = `0${curTime.getDate()}`.slice(-2);

      const date = `${yyyy}-${mm}-${dd}`;

      const isDLSStartDate = dlsMonth === +mm && dlsDate === +dd;

      for (
        let timeBinNum = 0;
        curTime.getDate() === +dd;
        ++timeBinNum, curTime.setMinutes(curTime.getMinutes() + timeBinSize)
      ) {
        if (isDLSStartDate && timeBinNum === dlsStartTimeBinNum) {
          timeBinNum = THREE_AM_MINS / timeBinSize;
        }

        const curDow = curTime.getDay();
        const curHour = curTime.getHours();

        mockNpmrdsData.push({
          date,
          timeBinNum,
          expectedDow: curDow,
          expectedHour: curHour
        });
      }
    }

    const data = shuffle(mockNpmrdsData);

    const testData = data.map(({ date, timeBinNum }) => ({ date, timeBinNum }));

    NpmrdsDataEnricher.enrichData({ year: YEAR, timeBinSize, data: testData });

    testData.forEach(({ dow, hour }, i) => {
      expect(dow).toEqual(data[i].expectedDow);
      expect(hour).toEqual(data[i].expectedHour);
    });
  });
});
