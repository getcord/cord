import { hasNumber } from 'external/src/delegate/location/util.ts';

test(`hasNumber`, () => {
  expect(hasNumber('string-with-no_numbers')).toEqual(false);
  expect(hasNumber('string-1-number')).toEqual(true);
  expect(hasNumber('string-02-numbers')).toEqual(true);
  expect(hasNumber('')).toEqual(false);
  expect(hasNumber('-></')).toEqual(false);
  expect(hasNumber('1')).toEqual(true);
  expect(hasNumber('10')).toEqual(true);
});
