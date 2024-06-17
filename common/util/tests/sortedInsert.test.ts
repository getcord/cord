import { sortedInsert } from 'common/util/sortedInsert.ts';

describe('sortedInsert', () => {
  const arr = [{ v: 'b' }, { v: 'd' }, { v: 'f' }];

  test('at front', () => {
    const res = sortedInsert(arr, { v: 'a' }, (x) => x.v);
    expect(res.length).toBe(4);
    expect(res[0].v).toBe('a');
    expect(res[1].v).toBe('b');
    expect(res[2].v).toBe('d');
    expect(res[3].v).toBe('f');
  });

  test('middle 1', () => {
    const res = sortedInsert(arr, { v: 'c' }, (x) => x.v);
    expect(res.length).toBe(4);
    expect(res[0].v).toBe('b');
    expect(res[1].v).toBe('c');
    expect(res[2].v).toBe('d');
    expect(res[3].v).toBe('f');
  });

  test('middle 2', () => {
    const res = sortedInsert(arr, { v: 'e' }, (x) => x.v);
    expect(res.length).toBe(4);
    expect(res[0].v).toBe('b');
    expect(res[1].v).toBe('d');
    expect(res[2].v).toBe('e');
    expect(res[3].v).toBe('f');
  });

  test('end', () => {
    const res = sortedInsert(arr, { v: 'g' }, (x) => x.v);
    expect(res.length).toBe(4);
    expect(res[0].v).toBe('b');
    expect(res[1].v).toBe('d');
    expect(res[2].v).toBe('f');
    expect(res[3].v).toBe('g');
  });
});
