import {
  backgroundPromise,
  waitForEmptyBackground,
} from 'server/src/util/backgroundPromise.ts';

let counter = 0;

function later() {
  return new Promise(process.nextTick);
}

async function incrementCounterLater() {
  await later();
  counter++;
}

async function throwError() {
  throw new Error('Something unexpected happened');
}

describe('background promises', () => {
  beforeEach(() => (counter = 0));

  test('no background promises', async () => {
    await waitForEmptyBackground();
    expect(counter).toBe(0);
  });

  test('two background promises concurrently', async () => {
    backgroundPromise(incrementCounterLater());
    backgroundPromise(incrementCounterLater());
    await waitForEmptyBackground();
    expect(counter).toBe(2);
  });

  test('two background promises serially', async () => {
    backgroundPromise(incrementCounterLater());
    await waitForEmptyBackground();
    expect(counter).toBe(1);

    backgroundPromise(incrementCounterLater());
    await waitForEmptyBackground();
    expect(counter).toBe(2);
  });

  test('two background promises nested', async () => {
    backgroundPromise(
      (async () => {
        await incrementCounterLater();
        backgroundPromise(incrementCounterLater());
      })(),
    );
    await waitForEmptyBackground();
    expect(counter).toBe(2);
  });

  test('two waiters', async () => {
    backgroundPromise(incrementCounterLater());
    await Promise.all([waitForEmptyBackground(), waitForEmptyBackground()]);
    expect(counter).toBe(1);
  });

  test('An error thrown by a promise is caught', async () => {
    expect(async () => {
      backgroundPromise(throwError());
    }).not.toThrow();
  });
});
