import { combine } from 'common/util/index.ts';

test('0 items', () => {
  expect(combine('or', [])).toEqual('');
});
test('1 item', () => {
  expect(combine('or', ['foo'])).toEqual('foo');
});
test('2 items', () => {
  expect(combine('or', ['foo', 'bar'])).toEqual('foo or bar');
});
test('3 items', () => {
  expect(combine('or', ['foo', 'bar', 'baz'])).toEqual('foo, bar, or baz');
});
test("spaces aren't modified specially", () => {
  expect(combine(' or', ['foo  ', ' bar ', '  baz'])).toEqual(
    'foo  ,  bar ,  or   baz',
  );
});
