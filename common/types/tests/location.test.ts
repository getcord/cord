import { isLocation } from 'common/types/index.ts';

test.each([
  undefined,
  null,
  '',
  '{"foo": "bar"}',
  3,
  true,
  [],
  [{ context: 'in array' }],
  { nestedObject: { bar: 'baz' } },
  { arrayValue: ['foo'] },
])('%s is not a valid location', (notValid) => {
  expect(isLocation(notValid)).toBe(false);
});

test.each([
  {},
  { foo: 'bar' },
  { foo: 'bar', bar: 'baz' },
  { number: 3, bool: true, string: 'yep' },
  { 'something with spaces': 'values too' },
])('%s is a valid location', (valid) => {
  expect(isLocation(valid)).toBe(true);
});
