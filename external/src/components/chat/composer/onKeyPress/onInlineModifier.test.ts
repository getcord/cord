import { findBeginDelimiter } from 'external/src/components/chat/composer/onKeyPress/onInlineModifier.ts';

test.each([
  ['*abc', '*', '', 'abc', '*'],
  ['_abc', '_', '', 'abc', '_'],
  ['*_abc', '*', '', '_abc', '*'],
  ['*_abc', '_', '', 'abc', '_'],
  ['**abc*def*', '*', '', 'abc*def', '**'],
  ['**abc_def*', '*', '', 'abc_def', '**'],
  ['abc *def', '*', '', 'def', '*'],
  ['abc _def', '_', ' ghi', 'def', '_'],
  ['abc *def ghi', '*', '\njkl', 'def ghi', '*'],
])(
  'valid delimiter: [%s>%s<%s]',
  (before, key, after, expectedMatchedPortion, expectedDelim) => {
    const result = findBeginDelimiter(before, after, key);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.delim).toBe(expectedDelim);
      expect(
        before.substring(result.begin, before.length - result.delim.length + 1),
      ).toBe(expectedMatchedPortion);
    }
  },
);

test.each([
  ['abc', '*', ''],
  ['abc', '_', ''],
  ['_abc', '*', ''],
  ['a*bc', '*', ''],
  ['a_bc', '_', ''],
  ['*abc', '*', 'd'],
  ['**abc', '*', ''],
  ['*ab\nc', '*', ''],
  ['* abc', '*', ''],
  ['_ abc', '_', ''],
  ['_*abc', '*', '_'],
  ['*abc ', '*', ''],
])('invalid delimiter: [%s>%s<%s]', (before, key, after) => {
  expect(findBeginDelimiter(before, after, key)).toBeNull();
});
