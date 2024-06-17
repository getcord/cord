import { uuidHash } from 'server/src/util/hash.ts';

test('plain text hashing', () => {
  const result = uuidHash('andrei');

  expect(result).toBeDefined();
  expect(result.length).toBe(36);
});

test('consistent hashing', () => {
  const result1 = uuidHash('andrei');
  const result2 = uuidHash('andrei');

  expect(result1).toEqual(result2);
});

test('dictionary hashing', () => {
  const result = uuidHash({
    key: 'foo',
  });

  expect(result).toBeDefined();
  expect(result.length).toBe(36);
});

test('consistent dictionary hashing', () => {
  // hash values should be the same regardless of key ordering

  const result1 = uuidHash({
    key1: 'foo',
    key2: 'bar',
  });

  const result2 = uuidHash({
    key2: 'bar',
    key1: 'foo',
  });

  expect(result1).toEqual(result2);
});

test('consistent deep dictionary hashing', () => {
  // hash values should be the same regardless of key ordering even in deeply nested objects

  const result1 = uuidHash({
    key1: 'foo',
    key2: 'bar',
    key3: {
      key4: 'yolo',
      key5: 'cord',
    },
  });

  const result2 = uuidHash({
    key2: 'bar',
    key3: {
      key5: 'cord',
      key4: 'yolo',
    },
    key1: 'foo',
  });

  expect(result1).toEqual(result2);
});
