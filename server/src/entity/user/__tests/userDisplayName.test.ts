import { userDisplayName } from 'server/src/entity/user/util.ts';

test('name fallback', () => {
  expect(
    userDisplayName({
      name: 'andrei',
      screenName: null,
    }),
  ).toBe('andrei');

  expect(
    userDisplayName({
      name: null,
      screenName: 'andrei',
    }),
  ).toBe('andrei');

  expect(
    userDisplayName({
      name: null,
      screenName: null,
    }),
  ).toBe('unknown');

  expect(
    userDisplayName({
      name: 'andrei',
      screenName: '',
    }),
  ).toBe('andrei');

  expect(
    userDisplayName({
      name: '',
      screenName: 'andrei',
    }),
  ).toBe('andrei');

  expect(
    userDisplayName({
      name: '',
      screenName: '',
    }),
  ).toBe('unknown');
});
