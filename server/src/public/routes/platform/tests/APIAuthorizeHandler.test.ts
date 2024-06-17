import * as jsonwebtoken from 'jsonwebtoken';
import isJWT from 'validator/lib/isJWT.js';
import { v4 as uuid } from 'uuid';
import { getServerAuthToken } from '@cord-sdk/server';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';
import {
  ACCESS_TOKEN_CLOCK_TOLERANCE_SECONDS,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
} from 'common/const/Timing.ts';
import { createPlatformApplication } from 'server/src/public/routes/tests/util.ts';

let application: ApplicationEntity;

describe('Platform API: /v1/authorize', () => {
  beforeAll(async () => {
    application = await createPlatformApplication('platform app', 'secret');
  });

  test('empty request', async () => {
    const { statusCode, body } = await apiCall().post('/v1/authorize');

    expect(statusCode).toBe(400);
    expect(body).toEqual({
      error: 'missing_field',
      message: 'Missing required field: signed_app_token.',
    });
  });

  test('missing field', async () => {
    const { statusCode, body } = await apiCall().post('/v1/authorize').send({
      field_1: 'field1',
      field_2: 'field2',
      field_3: 'field3',
    });

    expect(statusCode).toBe(400);
    expect(body).toEqual({
      error: 'missing_field',
      message: 'Missing required field: signed_app_token.',
    });
  });

  test('unexpected field', async () => {
    const { statusCode, body } = await apiCall().post('/v1/authorize').send({
      foo: 'bar',
      signed_app_token: 'baz',
    });

    expect(statusCode).toBe(400);
    expect(body).toEqual({
      error: 'unexpected_field',
      message:
        'foo is not a valid field name for this request. Expected 1 required field: signed_app_token.',
    });
  });

  test('correct number of fields and field name but with an invalid value', async () => {
    const { statusCode, body } = await apiCall().post('/v1/authorize').send({
      signed_app_token: 'wrong type of value',
    });

    expect(statusCode).toBe(400);
    expect(body).toEqual({
      error: 'invalid_field',
      message: 'Input type for signed_app_token is not valid, expected JWT.',
    });
  });

  test('correct number of fields and field name but with a different input type', async () => {
    const { statusCode, body } = await apiCall().post('/v1/authorize').send({
      signed_app_token: 1,
    });

    expect(statusCode).toBe(400);
    expect(body).toEqual({
      error: 'invalid_field',
      message: 'Input type for signed_app_token is not valid, expected JWT.',
    });
  });

  test('string as the token payload', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/authorize')
      .send({
        signed_app_token: jsonwebtoken.sign('string payload', 'random secret', {
          algorithm: 'HS512',
        }),
      });

    expect(statusCode).toBe(401);
    expect(body).toEqual({
      error: 'invalid_project_token',
      message:
        'Input type for signed_app_token payload is not valid, expected object.',
    });
  });

  test('token payload missing the required property', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/authorize')
      .send({
        signed_app_token: jsonwebtoken.sign(
          { property_one: 'wrong property' },
          'random secret',
          { algorithm: 'HS512' },
        ),
      });

    expect(statusCode).toBe(401);
    expect(body).toEqual({
      error: 'invalid_project_token',
      message: 'signed_app_token payload is missing app_id.',
    });
  });

  test('correct token payload property name but with an invalid value', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/authorize')
      .send({
        signed_app_token: jsonwebtoken.sign(
          { app_id: 'this is not a valid UUID' },
          'random secret',
          { algorithm: 'HS512' },
        ),
      });

    expect(statusCode).toBe(401);
    expect(body).toEqual({
      error: 'invalid_project_token',
      message: 'Input type for app_id is not valid, expected UUID.',
    });
  });

  test('correct token payload property name but with an invalid input type for app_id', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/authorize')
      .send({
        signed_app_token: jsonwebtoken.sign({ app_id: 32 }, 'random secret', {
          algorithm: 'HS512',
        }),
      });

    expect(statusCode).toBe(401);
    expect(body).toEqual({
      error: 'invalid_project_token',
      message: 'Input type for app_id is not valid, expected UUID.',
    });
  });

  test('valid token payload but row does not exist in the database', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/authorize')
      .send({
        signed_app_token: jsonwebtoken.sign(
          { app_id: uuid() },
          'random secret',
          { algorithm: 'HS512' },
        ),
      });

    expect(statusCode).toBe(401);
    expect(body).toEqual({
      error: 'project_not_found',
      message: 'Platform project not found.',
    });
  });

  test('valid token payload but shared secret is incorrect', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/authorize')
      .send({
        signed_app_token: jsonwebtoken.sign(
          { app_id: application.id },
          'random secret',
          { algorithm: 'HS512' },
        ),
      });

    expect(statusCode).toBe(401);
    expect(body).toEqual({
      error: 'invalid_project_token',
      message: 'JsonWebTokenError: invalid signature',
    });
  });

  test('valid token payload and secret but maxAge exceeded', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    const { statusCode, body } = await apiCall()
      .post('/v1/authorize')
      .send({
        signed_app_token: jsonwebtoken.sign(
          {
            app_id: application.id,
            // to create a token with iat that exceeds the maxAge we have to
            // add maxAge (60) to the clockTolerance (30) and then exceed this with 1.
            iat:
              nowSeconds -
              (ACCESS_TOKEN_MAX_AGE_SECONDS +
                ACCESS_TOKEN_CLOCK_TOLERANCE_SECONDS +
                1),
          },
          'secret',
          { algorithm: 'HS512' },
        ),
      });

    expect(statusCode).toBe(401);
    expect(body).toEqual({
      error: 'invalid_project_token',
      message: 'TokenExpiredError: maxAge exceeded',
    });
  });

  test('valid token but signed with incorrect algorithm', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/authorize')
      .send({
        signed_app_token: jsonwebtoken.sign(
          { app_id: application.id },
          'secret',
          { algorithm: 'HS256' },
        ),
      });

    expect(statusCode).toBe(401);
    expect(body).toEqual({
      error: 'invalid_project_token',
      message: 'JsonWebTokenError: invalid algorithm',
    });
  });

  test('valid token but other fields also present in payload', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/authorize')
      .send({
        signed_app_token: jsonwebtoken.sign(
          { app_id: application.id, user_id: '123' },
          'secret',
          { algorithm: 'HS512' },
        ),
      });

    expect(statusCode).toBe(401);
    expect(body).toEqual({
      error: 'invalid_project_token',
      message: 'signed_app_token payload invalid, must contain only app_id',
    });
  });

  test('valid token', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/authorize')
      .send({
        signed_app_token: jsonwebtoken.sign(
          { app_id: application.id },
          'secret',
          { algorithm: 'HS512' },
        ),
      });

    expect(statusCode).toBe(200);
    expect(body.access_token).toBeDefined();
    expect(isJWT.default(body.access_token)).toBe(true);
    expect(body.expires).toBeDefined();
    expect(new Date(body.expires)).toBeInstanceOf(Date);
  });

  test('valid token from getServerAuthToken', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/authorize')
      .send({
        signed_app_token: getServerAuthToken(application.id, 'secret'),
      });

    expect(statusCode).toBe(200);
    expect(body.access_token).toBeDefined();
    expect(isJWT.default(body.access_token)).toBe(true);
    expect(body.expires).toBeDefined();
    expect(new Date(body.expires)).toBeInstanceOf(Date);
  });
});
