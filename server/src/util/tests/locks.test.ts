import { withLock } from 'server/src/util/locks.ts';
import 'server/src/tests/setupEnvironment';
import sleep from 'common/util/sleep.ts';

test('single lock is executed non-concurrently', async () => {
  let counter = 0;
  const promises: Promise<void>[] = [];

  for (let i = 0; i < 10; ++i) {
    promises.push(
      withLock('lock')(async () => {
        // Read counter, sleep 50ms, write new value for counter. If this code
        // was to run in parallel, we would most certainly not end up with a
        // value of 10 for `counter`

        const oldCounter = counter;
        await sleep(50);
        counter = oldCounter + 1;
      }),
    );
  }

  await Promise.all(promises);

  // `counter` was incremented 10 times.
  expect(counter).toBe(10);
});

test('different queues run in parallel', async () => {
  let counter1 = 0;
  let counter2 = 0;

  let resolve1: () => void;
  let resolve2: () => void;

  const promise1 = new Promise<void>((resolve) => {
    resolve1 = resolve;
  });
  const promise2 = new Promise<void>((resolve) => {
    resolve2 = resolve;
  });

  // The following code would deadlock, if queue1 and queue2 couldn't be held in
  // parallel.

  const op1 = withLock('queue1')(async () => {
    // Wait 50ms
    await sleep(50);

    // Resolve promise1
    resolve1();

    counter1++;

    // Wait for promise2, i.e. for op2 to have started
    await promise2;
  });

  //
  const op2 = withLock('queue2')(async () => {
    // Wait 50ms
    await sleep(50);

    // Resolve promise2
    resolve2();

    counter2++;

    // Wait for promise1, i.e. for op1 to have started
    await promise1;
  }).then(resolve2!);

  await op1;
  await op2;

  expect(counter1).toBe(1);
  expect(counter2).toBe(1);
});
