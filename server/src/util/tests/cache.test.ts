import sleep from 'common/util/sleep.ts';
import { cachedResult } from 'server/src/util/cache.ts';

test('expiration', async () => {
  let counter = 0;
  const key = 'counter';
  const generator = async () => ++counter;

  const cachedValue1 = await cachedResult(generator, key, 0.2);
  expect(cachedValue1).toBe(1);
  expect(counter).toBe(1);

  // wait 0.1 seconds - cache still not expired
  await sleep(100);
  const cachedValue2 = await cachedResult(generator, key, 0.2);
  expect(cachedValue2).toBe(1);
  expect(counter).toBe(1);

  // wait anoter 0.2 seconds - cache should now be expired
  await sleep(200);

  const cachedValue3 = await cachedResult(generator, key, 0.2);
  expect(cachedValue3).toBe(2);
  expect(counter).toBe(2);
});
