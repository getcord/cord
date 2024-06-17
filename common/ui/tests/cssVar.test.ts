import type { CSSVariable } from 'common/ui/cssVariables.ts';
import {
  cssVar,
  cssVariableFallbacks,
  getCordCSSVariableDefaultValueDeep,
} from 'common/ui/cssVariables.ts';

describe('cssVar', () => {
  // If two var fallback values are set to equal each other, this test will fail
  // with a 'Maximum call stack size exceeded' error
  test('cssVars work, i.e. no loops', () => {
    const vars = [];
    let varName: keyof typeof cssVariableFallbacks;
    for (varName in cssVariableFallbacks) {
      vars.push(cssVar(varName));
    }
    expect(vars).toBeTruthy();
  });

  const tests: Array<[CSSVariable, string]> = [
    ['shadow-small', '0 2px 4px 0 rgba(0,0,0,0.08)'],
    ['shadow-large', '0 2px 16px 0 rgba(0,0,0,0.16)'],
    ['border-radius-small', 'calc(4px / 2)'],
    ['border-radius-medium', '4px'],
    ['border-radius-large', 'calc(4px * 2)'],
    ['composer-height-max', 'min(40vh, 10em)'],
    ['sidebar-top', '0px'],
    ['launcher-background-color', '#F4FFA0'],
  ];
  test.each(tests)(
    'getCordCSSVariableDefaultValueDeep(%s) should equal %s',
    (input, expected) =>
      expect(getCordCSSVariableDefaultValueDeep(input)).toEqual(expected),
  );
});
