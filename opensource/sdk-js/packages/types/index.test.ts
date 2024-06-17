import { describe, expect, test } from '@jest/globals';
import { isEqualLocation } from './index.js';

describe('isEqualLocation', () => {
  test('undefined behavior', () => {
    expect(isEqualLocation(undefined, undefined)).toBeTruthy();
    expect(isEqualLocation(undefined, {})).toBeFalsy();
    expect(isEqualLocation(undefined, { foo: 'bar' })).toBeFalsy();
    expect(isEqualLocation({}, undefined)).toBeFalsy();
    expect(isEqualLocation({ foo: 'bar' }, undefined)).toBeFalsy();
  });

  test('empty location', () => {
    expect(isEqualLocation({}, {})).toBeTruthy();
  });

  test('comparing locations', () => {
    const loc = { foo: 'bar', x: 'y' };

    expect(isEqualLocation(loc, loc)).toBeTruthy();
    expect(isEqualLocation(loc, { x: 'y', foo: 'bar' })).toBeTruthy();

    expect(isEqualLocation(loc, {})).toBeFalsy();
    expect(isEqualLocation(loc, { foo: 'bar' })).toBeFalsy();
    expect(isEqualLocation(loc, { x: 'y' })).toBeFalsy();
    expect(isEqualLocation(loc, { foo: 'baz', x: 'y' })).toBeFalsy();
    expect(isEqualLocation(loc, { foo: 'bar', x: 'y', z: '1' })).toBeFalsy();

    // We need to use `as any` to place `undefined` values in the Location,
    // because the Location type does not allow that.
    expect(
      isEqualLocation(loc, { foo: 'bar', x: undefined } as any),
    ).toBeFalsy();
    expect(
      isEqualLocation(loc, { foo: 'bar', x: 'y', z: undefined } as any),
    ).toBeFalsy();
  });
});
