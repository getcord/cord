import {
  cssVarWithOverride,
  cssValueWithOverride,
  cssVar,
} from 'common/ui/cssVariables.ts';

describe('cssValueWithOverride', () => {
  test('no value, no override', () => {
    expect(cssValueWithOverride(undefined, undefined)).toBeUndefined();
  });

  test('no value, override', () => {
    expect(cssValueWithOverride(undefined, 'space-m')).toBe(cssVar('space-m'));
  });

  test('value, no override', () => {
    expect(cssValueWithOverride('blue', undefined)).toBe('blue');
  });

  test('value and override', () => {
    expect(cssValueWithOverride('blue', 'space-m')).toBe(cssVar('space-m'));
  });
});

describe('cssVarWithOverride', () => {
  test('no var, no override', () => {
    expect(cssVarWithOverride(undefined, undefined)).toBeUndefined();
  });

  test('var, no override', () => {
    expect(cssVarWithOverride('color-base', undefined)).toBe(
      cssVar('color-base'),
    );
  });

  test('no var, override', () => {
    expect(cssVarWithOverride(undefined, 'space-m')).toBe(cssVar('space-m'));
  });

  test('var and override', () => {
    expect(cssVarWithOverride('color-base', 'color-alert')).toBe(
      cssVar('color-alert'),
    );
  });
});
