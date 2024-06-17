import {
  isTimestampTodayOrInTheFuture,
  isTimestampFromPastSevenDays,
  isTimestampFromPastThirtyDays,
  isTimestampFromPastThreeMonths,
  isTimestampFromPastYear,
  isTimestampMoreThanAYearAgo,
} from 'common/util/index.ts';

describe('Testing waymarker util functions', () => {
  const nowTimestamp = new Date(Date.now());

  function getDateFromXDaysAgo(currentTimestamp: Date, numberOfDays: number) {
    return new Date(
      new Date(currentTimestamp.toString()).setDate(
        currentTimestamp.getDate() - numberOfDays,
      ),
    ).toString();
  }

  function getDateFromXMonthsAgo(
    currentTimestamp: Date,
    numberOfMonths: number,
  ) {
    return new Date(
      new Date(currentTimestamp.toString()).setMonth(
        currentTimestamp.getMonth() - numberOfMonths,
      ),
    ).toString();
  }

  function getDateFromAYearAgo(currentTimestamp: Date) {
    return new Date(
      new Date(currentTimestamp.toString()).setFullYear(
        currentTimestamp.getFullYear() - 1,
      ),
    ).toString();
  }
  const timestampInFuture = getDateFromXDaysAgo(nowTimestamp, -3);
  const timestampThreeDaysAgo = getDateFromXDaysAgo(nowTimestamp, 3);
  const timestampSixDaysAgo = getDateFromXDaysAgo(nowTimestamp, 6);
  const timestampSevenDaysAgo = getDateFromXDaysAgo(nowTimestamp, 7);
  const timestampEightDaysAgo = getDateFromXDaysAgo(nowTimestamp, 8);
  const timestampThirteenDaysAgo = getDateFromXDaysAgo(nowTimestamp, 13);
  const timestampThirtyDaysAgo = getDateFromXDaysAgo(nowTimestamp, 30);
  const timestampThirtyOneDaysAgo = getDateFromXDaysAgo(nowTimestamp, 31);
  const timestampOneMonthAgo = getDateFromXMonthsAgo(nowTimestamp, 1);
  const timestampTwoMonthsAgo = getDateFromXMonthsAgo(nowTimestamp, 2);
  const timestampThreeMonthsAgo = getDateFromXMonthsAgo(nowTimestamp, 3);
  const timestampSevenMonthsAgo = getDateFromXMonthsAgo(nowTimestamp, 7);
  const timestampTwelveMonthsAgo = getDateFromXMonthsAgo(nowTimestamp, 12);
  const timestampTwentyFourMonthsAgo = getDateFromXMonthsAgo(nowTimestamp, 24);

  const timestampAYearAgo = getDateFromAYearAgo(nowTimestamp);

  test('is timestamp from today', () => {
    expect(isTimestampTodayOrInTheFuture(nowTimestamp.toString())).toBe(true);
    expect(isTimestampTodayOrInTheFuture('1991-01-01')).toBe(false);
    expect(isTimestampTodayOrInTheFuture(timestampInFuture)).toBe(true);
  });

  test('is timestamp from past 7 days', () => {
    expect(isTimestampFromPastSevenDays(timestampThreeDaysAgo)).toBe(true);
    expect(isTimestampFromPastSevenDays(timestampSixDaysAgo)).toBe(true);
    expect(isTimestampFromPastSevenDays(timestampSevenDaysAgo)).toBe(true);
    expect(isTimestampFromPastSevenDays(timestampEightDaysAgo)).toBe(false);
    expect(isTimestampFromPastSevenDays(timestampThirteenDaysAgo)).toBe(false);
  });

  test('is timestamp from past 30 days', () => {
    expect(isTimestampFromPastThirtyDays(timestampThirteenDaysAgo)).toBe(true);
    expect(isTimestampFromPastThirtyDays(timestampThirtyDaysAgo)).toBe(true);
    expect(isTimestampFromPastThirtyDays(timestampThirtyOneDaysAgo)).toBe(
      false,
    );
  });

  test('is timestamp from past 3 months', () => {
    expect(isTimestampFromPastThreeMonths(timestampOneMonthAgo)).toBe(true);
    expect(isTimestampFromPastThreeMonths(timestampTwoMonthsAgo)).toBe(true);
    expect(isTimestampFromPastThreeMonths(timestampThreeMonthsAgo)).toBe(true);
    expect(isTimestampFromPastThreeMonths(timestampSevenMonthsAgo)).toBe(false);
  });

  test('is timestamp from past year', () => {
    expect(isTimestampFromPastYear(timestampThreeMonthsAgo)).toBe(true);
    expect(isTimestampFromPastYear(timestampSevenMonthsAgo)).toBe(true);
    expect(isTimestampFromPastYear(timestampTwelveMonthsAgo)).toBe(true);
    expect(isTimestampFromPastYear(timestampTwentyFourMonthsAgo)).toBe(false);
  });

  test('is timestamp more than a year ago', () => {
    expect(isTimestampMoreThanAYearAgo(timestampThreeMonthsAgo)).toBe(false);
    expect(isTimestampMoreThanAYearAgo(timestampSevenMonthsAgo)).toBe(false);
    expect(isTimestampMoreThanAYearAgo(timestampTwelveMonthsAgo)).toBe(false);
    expect(isTimestampMoreThanAYearAgo(timestampAYearAgo)).toBe(false);
    expect(isTimestampMoreThanAYearAgo(timestampTwentyFourMonthsAgo)).toBe(
      true,
    );
    expect(isTimestampMoreThanAYearAgo('1991-01-05')).toBe(true);
  });
});
