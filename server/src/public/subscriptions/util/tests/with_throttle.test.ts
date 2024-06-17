import { jest } from '@jest/globals';

import sleep from 'common/util/sleep.ts';
import { withThrottle } from 'server/src/public/subscriptions/util/with_throttle.ts';

jest.useFakeTimers();

async function* iterator(delays: number[]) {
  for (let i = 0; i < delays.length; i++) {
    yield i;
    if (delays[i] > 0) {
      await sleep(delays[i]);
    }
  }
}

async function collectResults<T>(it: AsyncIterator<T>) {
  const results = [];
  // AsyncIterator<T> implements AsyncIterable<T>, but TypeScript's types don't
  // reflect that for some reason
  for await (const val of it as any as AsyncIterable<T>) {
    results.push(val);
  }
  return results;
}

describe('withThrottle', () => {
  test('no throttling', async () => {
    const throttled = withThrottle(() => iterator([5, 5, 10]), 2)();
    const resultsPromise = collectResults(throttled);
    await jest.advanceTimersByTimeAsync(20);
    expect(await resultsPromise).toEqual([0, 1, 2]);
  });

  test('basic throttling', async () => {
    const throttled = withThrottle(() => iterator([5, 5, 10]), 15)();
    const resultsPromise = collectResults(throttled);
    await jest.advanceTimersByTimeAsync(30);
    expect(await resultsPromise).toEqual([0, 2]);
  });

  test('multiple throttled events', async () => {
    // 8 events, 20ms apart, with 55ms throttling, should mean:
    // [0: sent, 20ms: skip, 40ms: sent @55ms, 60ms: skip, 80ms: skip,
    //  100ms: sent @110ms, 120ms: skip, 140ms: sent @165ms]
    const throttled = withThrottle(
      () => iterator([20, 20, 20, 20, 20, 20, 20, 60]),
      55,
    )();
    const resultsPromise = collectResults(throttled);
    await jest.advanceTimersByTimeAsync(200);
    expect(await resultsPromise).toEqual([0, 2, 5, 7]);
  });

  test('delivers the last value along with done events', async () => {
    // If we don't wait at all after the last event, the done event will come
    // immediately, but we should still deliver the stored value
    const throttled = withThrottle(() => iterator([5, 5, 0]), 15)();
    const resultsPromise = collectResults(throttled);
    await jest.advanceTimersByTimeAsync(20);
    expect(await resultsPromise).toEqual([0, 2]);
  });

  test('stores values if they come while not waiting', async () => {
    // If we deliver a a stored value because of throttling and then a value
    // comes from the source iterator, we want to make sure that gets delivered
    //
    // The sequence of events here should be:
    // * First request to throttled requests it from source, delivered immediately
    // * Second request to throttled requests it from source, stashed for storage
    // * While timer is waiting, rerequest from source, third comes through, stashed
    // * Timer expires, stashed value (third) is delivered
    // * While sleep() is happening, fourth value comes in from source, stashed away
    // * Next request to throttled is satisfied immediately
    // * Final request to throttled requests from source, delivered immediately
    const throttled = withThrottle(() => iterator([1, 1, 20, 20, 20]), 10)();
    async function collect() {
      const first = (await throttled.next()).value;
      const second = (await throttled.next()).value;
      await sleep(15);
      const third = (await throttled.next()).value;
      const fourth = (await throttled.next()).value;
      return [first, second, third, fourth];
    }
    const resultsPromise = collect();
    await jest.advanceTimersByTimeAsync(100);
    expect(await resultsPromise).toEqual([0, 2, 3, 4]);
  });
});

// Each test in this section throttles the even and odd elements separately
describe('withThrottle with key', () => {
  test('no throttling', async () => {
    const throttled = withThrottle(
      () => iterator([5, 5, 10]),
      2,
      (i) => i % 2,
    )();
    const resultsPromise = collectResults(throttled);
    await jest.advanceTimersByTimeAsync(20);
    expect(await resultsPromise).toEqual([0, 1, 2]);
  });

  test('basic throttling', async () => {
    const throttled = withThrottle(
      () => iterator([2, 2, 2, 2, 2, 10]),
      15,
      (i) => i % 2,
    )();
    const resultsPromise = collectResults(throttled);
    await jest.advanceTimersByTimeAsync(30);
    expect(await resultsPromise).toEqual([0, 1, 4, 5]);
  });

  test('multiple throttled events', async () => {
    // 8 events, 20ms apart, with 55ms throttling, should mean:
    // [0: sent, 20ms: skip, 40ms: sent @55ms, 60ms: skip, 80ms: skip,
    //  100ms: sent @110ms, 120ms: skip, 140ms: sent @165ms]

    // The two event streams (the even and odd events) should be throttled
    // separately
    const throttled = withThrottle(
      () => iterator([0, 20, 0, 20, 0, 20, 0, 20, 0, 20, 0, 20, 0, 20, 0, 60]),
      55,
      (i) => i % 2,
    )();
    const resultsPromise = collectResults(throttled);
    await jest.advanceTimersByTimeAsync(200);
    expect(await resultsPromise).toEqual([0, 1, 4, 5, 10, 11, 14, 15]);
  });

  test('delivers the last value along with done events', async () => {
    // If we don't wait at all after the last event, the done event will come
    // immediately, but we should still deliver the stored value
    const throttled = withThrottle(
      () => iterator([2, 2, 2, 2, 2, 0]),
      15,
      (i) => i % 2,
    )();
    const resultsPromise = collectResults(throttled);
    await jest.advanceTimersByTimeAsync(20);
    expect(await resultsPromise).toEqual([0, 1, 4, 5]);
  });

  test('stores values if they come while not waiting', async () => {
    // If we deliver a a stored value because of throttling and then a value
    // comes from the source iterator, we want to make sure that gets delivered
    //
    // The sequence of events here should be:
    // * First request to throttled requests it from source, delivered immediately
    // * Second request to throttled requests it from source, stashed for storage
    // * While timer is waiting, rerequest from source, third comes through, stashed
    // * Timer expires, stashed value (third) is delivered
    // * While sleep() is happening, fourth value comes in from source, stashed away
    // * Next request to throttled is satisfied immediately
    // * Final request to throttled requests from source, delivered immediately
    const throttled = withThrottle(
      () => iterator([0, 1, 0, 1, 0, 20, 0, 20, 0, 20]),
      10,
      (i) => i % 2,
    )();
    async function collect() {
      const first = (await throttled.next()).value;
      const second = (await throttled.next()).value;
      const third = (await throttled.next()).value;
      const fourth = (await throttled.next()).value;
      await sleep(15);
      const fifth = (await throttled.next()).value;
      const sixth = (await throttled.next()).value;
      const seventh = (await throttled.next()).value;
      const eighth = (await throttled.next()).value;
      return [first, second, third, fourth, fifth, sixth, seventh, eighth];
    }
    const resultsPromise = collect();
    await jest.advanceTimersByTimeAsync(100);
    expect(await resultsPromise).toEqual([0, 1, 4, 5, 6, 7, 8, 9]);
  });
});
