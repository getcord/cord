import { stripInboxCountPrefix } from 'common/page_context/util.ts';

test('extracts text from title with inbox count prefix', () => {
  expect(stripInboxCountPrefix('(1) hey hey!')).toBe('hey hey!');
});

test('leaves title with no inbox count prefix alone', () => {
  expect(stripInboxCountPrefix('hey there!')).toBe('hey there!');
});

test('leaves title with only inbox count prefix alone', () => {
  expect(stripInboxCountPrefix('(123)')).toBe('(123)');
  expect(stripInboxCountPrefix('(123)    ')).toBe('(123)');
});
