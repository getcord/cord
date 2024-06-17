import { clamp } from 'common/util/clamp.ts';

describe('clamp', () => {
  test('clamp', () => {
    expect(clamp(4, 0, 10)).toBe(4);
    expect(clamp(4, 5, 10)).toBe(5);
    expect(clamp(4, 0, 2)).toBe(2);

    // Invalid, but codifying the lodash behaviour.
    expect(clamp(0, 100, -100)).toBe(100);
  });
});
