import { asyncFilter } from 'common/util/asyncFilter.ts';

describe('asyncFilter', () => {
  test('Even numbers', async () => {
    const res = await asyncFilter([1, 2, 3, 4, 5], async (n) => n % 2 === 0);
    expect(res).toEqual([2, 4]);
  });

  test('undefined and null', async () => {
    const res = await asyncFilter(
      [null, 42, undefined, 42, null],
      async (n) => n !== 42,
    );
    expect(res).toEqual([null, undefined, null]);
  });
});
