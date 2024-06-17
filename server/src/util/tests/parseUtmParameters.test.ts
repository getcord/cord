import { parseUtmParameters } from 'server/src/util/cookies.ts';

test('basic test', () => {
  expect(parseUtmParameters('')).toBeUndefined();
  expect(parseUtmParameters('?foo=bar')).toBeUndefined();
  expect(parseUtmParameters('?utm=abc&foo=bar')).toBeUndefined();
  expect(parseUtmParameters('?foo=bar&utm=abc')).toBeUndefined();
  expect(parseUtmParameters('?utm_alice=bob')).toStrictEqual({ alice: 'bob' });
  expect(parseUtmParameters('?utm_alice=bob&foo=bar')).toStrictEqual({
    alice: 'bob',
  });
  expect(parseUtmParameters('?utm=abc&utm_alice=bob&foo=bar')).toStrictEqual({
    alice: 'bob',
  });
  expect(
    parseUtmParameters('?utm_X=1&foo=bar&utm_Y=2&utm=nothing&utm_Z=3'),
  ).toStrictEqual({ X: '1', Y: '2', Z: '3' });
  expect(
    parseUtmParameters('?utm_X=1&foo=bar&utm_X=2&utm=nothing&utm_X=3'),
  ).toEqual({ X: ['1', '2', '3'] });
  expect(
    parseUtmParameters('?utm_campaign=' + encodeURIComponent('foo [bar]')),
  ).toEqual({ campaign: 'foo [bar]' });
  expect(
    parseUtmParameters('?utm_campaign=' + encodeURIComponent('foo+bar')),
  ).toEqual({ campaign: 'foo+bar' });
  expect(
    parseUtmParameters('?utm_campaign=' + encodeURIComponent('foo%bar')),
  ).toEqual({ campaign: 'foo%bar' });
  expect(
    parseUtmParameters('?utm_campaign=' + encodeURIComponent('foo.bar!')),
  ).toEqual({ campaign: 'foo.bar!' });
});
