import sleep from 'common/util/sleep.ts';
import { AsyncChannel } from 'server/src/util/AsyncChannel.ts';

test('wait for one item', async () => {
  const ch = new AsyncChannel<string>();

  // Start waiting for next item on channel
  let finished = false;
  const next = ch.next().finally(() => {
    finished = true;
  });

  // Wait 5ms and check the `next.finally` hasn't run
  await sleep(5);
  expect(finished).toBeFalsy();

  // Now push item into channel
  ch.push('hello');

  // And check that `next` now resolves to the item
  expect((await next).value).toBe('hello');
  expect(finished).toBeTruthy();
});

test('wait for multiple items', async () => {
  const ch = new AsyncChannel<string>();

  // Start waiting for next item on channel
  let finished1 = false;
  let finished2 = false;
  let finished3 = false;

  const item1 = ch.next().finally(() => {
    finished1 = true;
  });

  const item2 = ch.next().finally(() => {
    finished2 = true;
  });

  const item3 = ch.next().finally(() => {
    finished3 = true;
  });

  // Wait 5ms and check the `item{1,2,3}.finally` hasn't run
  await sleep(5);
  expect(finished1).toBeFalsy();
  expect(finished2).toBeFalsy();
  expect(finished3).toBeFalsy();

  // Now push items into channel
  ch.push('item1');
  expect((await item1).value).toBe('item1');
  expect(finished2).toBeFalsy();
  expect(finished3).toBeFalsy();

  ch.push('item2');
  expect((await item2).value).toBe('item2');
  expect(finished3).toBeFalsy();

  ch.push('item3');
  expect((await item3).value).toBe('item3');
});

test('queue items', async () => {
  const ch = new AsyncChannel<string>();

  // Push three items
  ch.push('item1');
  ch.push('item2');
  ch.push('item3');

  // Now take those
  expect((await ch.next()).value).toBe('item1');
  expect((await ch.next()).value).toBe('item2');
  expect((await ch.next()).value).toBe('item3');
});

test('mixed', async () => {
  const ch = new AsyncChannel<string>();
  const put: string[] = [];
  const taken: Promise<IteratorResult<string>>[] = [];

  // Pseudo-randomly put into and take from channel
  for (const op of Array.from('pttpptptptppppttttptppptptpttpttttptpppt')) {
    switch (op) {
      case 'p':
        {
          const item = `item${put.length}`;
          ch.push(item);
          put.push(item);
        }
        break;
      case 't':
        taken.push(ch.next());
        break;
    }
  }

  // Check that the items taken from the channel are the ones we put
  expect((await Promise.all(taken)).map((res) => res.value)).toEqual(put);
});

test('takeAll', async () => {
  const ch = new AsyncChannel<string>();

  expect(ch.takeAll()).toEqual([]);

  // Push three items
  ch.push('item1');
  ch.push('item2');
  ch.push('item3');

  // Now take those
  expect((await ch.next()).value).toBe('item1');
  expect(ch.takeAll()).toEqual(['item2', 'item3']);
  expect(ch.takeAll()).toEqual([]);
});

test('asyncIterator', async () => {
  const ch = new AsyncChannel<string>();

  // Push three items
  ch.push('item1');
  ch.push('item2');
  ch.push('item3');

  let counter = 0;
  for await (const item of ch) {
    ++counter;
    expect(item).toEqual(`item${counter}`);

    // enqueue a new item
    ch.push(`item${counter + 3}`);

    // This would go on forever, so quit after 10 items.
    if (counter === 10) {
      break;
    }
  }
});

test('promise channel', async () => {
  const ch = new AsyncChannel<Promise<string>>();

  // Push
  ch.push(Promise.resolve('item1'));

  // Take
  expect(await (await ch.next()).value).toBe('item1');

  // Push
  ch.push(Promise.reject(new Error('bang')));

  // Take
  void expect((await ch.next()).value).rejects.toThrow('bang');
});
