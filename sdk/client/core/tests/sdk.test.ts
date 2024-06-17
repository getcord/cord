import sign from 'jwt-encode';
import {
  accessTokenPayloadsMatch,
  decodeAccessTokenPayload,
} from 'sdk/client/core/util.ts';

describe('decodeAccessTokenPayload', () => {
  test('identity correctly decoded, ignoring iat and exp', () => {
    const token = sign(
      {
        app_id: 'app',
        user_id: 'user',
        organization_id: 'org',
        iat: Date.now(),
        exp: Date.now() + 1000,
      },
      'secret',
    );

    expect(decodeAccessTokenPayload(token)).toEqual({
      app_id: 'app',
      user_id: 'user',
      organization_id: 'org',
    });
  });

  test('identity decodes to null when the string is not a valid JWT', () => {
    expect(decodeAccessTokenPayload('yolo')).toBeNull();
    expect(decodeAccessTokenPayload('a.b.c')).toBeNull();
  });

  test('identity decodes to null when payload is not an object', () => {
    expect(
      decodeAccessTokenPayload(
        `a.${Buffer.from(JSON.stringify('hello')).toString('base64')}.c`,
      ),
    ).toBeNull();
  });
});

describe('accessTokenPayloadsMatch', () => {
  test('identity matches', () => {
    const token1 = sign(
      {
        app_id: 'app',
        user_id: 'user',
        organization_id: 'org',
        iat: Date.now(),
        exp: Date.now() + 1000,
      },
      'secret',
    );

    const token2 = sign(
      {
        app_id: 'app',
        user_id: 'user',
        organization_id: 'org',
        iat: Date.now() + 2000,
        exp: Date.now() + 3000,
      },
      'secret',
    );

    expect(accessTokenPayloadsMatch(token1, token2)).toBe(true);
  });

  test("identity doesn't match", () => {
    const token1 = sign(
      {
        app_id: 'app',
        user_id: 'user',
        organization_id: 'org',
      },
      'secret',
    );

    const token2 = sign(
      {
        app_id: 'app',
        user_id: 'user_2',
        organization_id: 'org',
      },
      'secret',
    );

    expect(accessTokenPayloadsMatch(token1, token2)).toBe(false);
  });

  test("identity doesn't match when first token is undefined", () => {
    const token = sign(
      {
        app_id: 'app',
        user_id: 'user',
        organization_id: 'org',
      },
      'secret',
    );

    expect(accessTokenPayloadsMatch(undefined, token)).toBe(false);
  });
});
