import {
  findLast,
  findLastIndex,
} from '@cord-sdk/react/common/lib/findLast.ts';

describe('findLast', () => {
  test('findLast', () => {
    expect(findLast([5, 6, 7, 8], (x) => x % 2 === 0)).toBe(8);
    expect(findLast([5, 6, 7, 8], (x) => x % 2 === 0, 3)).toBe(8);
    expect(findLast([5, 6, 7, 8], (x) => x % 2 === 0, 2)).toBe(6);

    expect(findLast([5, 6, 7, 8], (x) => x % 5 === 0)).toBe(5);

    expect(findLast([5, 6, 7, 8], (x) => x === 42)).toBeUndefined();

    expect(findLast([5, 6, 7, null, 0])).toBe(7);

    expect(findLastIndex('hello', (c) => c === 'l')).toBe(3);
    expect(findLastIndex('hello', (c) => c === 'x')).toBe(-1);
  });
});
