/**
 * @jest-environment jsdom
 */

import { getParamFromLocation } from 'external/src/lib/auth/utils.ts';

test('token', () => {
  window.location.hash = '#token=magicbeans';
  expect(getParamFromLocation('token')).toBe('magicbeans');
  expect(getParamFromLocation('service')).toBe(undefined);
});

test('service', () => {
  window.location.hash = '#token=magicbeans&service=slack';
  expect(getParamFromLocation('token')).toBe('magicbeans');
  expect(getParamFromLocation('service')).toBe('slack');
});

test('only service', () => {
  window.location.hash = '#service=slack';
  expect(getParamFromLocation('token')).toBe(undefined);
  expect(getParamFromLocation('service')).toBe('slack');
});
