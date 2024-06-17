import { Sequelize } from 'sequelize';
import * as jsonwebtoken from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

import env from 'server/src/config/Env.ts';
import { ACCESS_TOKEN_TTL_HOURS } from 'common/const/IntegrationAPI.ts';
import { SessionEntity } from 'server/src/entity/session/SessionEntity.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { createPlatformApplication } from 'server/src/public/routes/tests/util.ts';

let application: ApplicationEntity;

describe('VerifyAPIAccesssToken middleware on /v1/organizations with no body', () => {
  beforeAll(async () => {
    application = await createPlatformApplication('platform app', 'secret');
  });

  test('missing authorization header', async () => {
    const { statusCode, body } = await apiCall().post('/v1/organizations');

    expect(statusCode).toBe(401);
    expect(body).toEqual({
      error: 'missing_authorization_header',
      message: 'Authorization header bearer token must be present.',
    });
  });

  test('non-bearer authorization header', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', 'invalid token');

    expect(statusCode).toBe(401);
    expect(body).toEqual({
      error: 'invalid_authorization_header',
      message: 'Expecting a token with a Bearer prefix.',
    });
  });

  test('invalid bearer token authorization header', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', 'Bearer invalid token');

    expect(statusCode).toBe(401);
    expect(body).toEqual({
      error: 'invalid_authorization_header',
      message:
        'Input type for authorization header bearer token is not valid, expected JWT.',
    });
  });

  test('valid bearer token signed with wrong secret', async () => {
    const accessToken = jsonwebtoken.sign(
      { session_id: uuid() },
      'wrong secret',
      { algorithm: 'HS512' },
    );

    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(401);
    expect(body).toEqual({
      error: 'invalid_project_token',
      message:
        'Please include the project_id if you are authorizing directly with a non-Cord signed token.',
    });
  });

  test('valid bearer token and secret but with non-object payload', async () => {
    const accessToken = jsonwebtoken.sign(
      'string payload',
      env.JWT_SIGNING_SECRET,
      { algorithm: 'HS512' },
    );

    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(401);
    expect(body).toEqual({
      error: 'invalid_access_token',
      message:
        'Input type for access token payload is not valid, expected object.',
    });
  });

  test('valid bearer token and secret but with unexpected payload property', async () => {
    const accessToken = jsonwebtoken.sign(
      { wrong_field: 'wrong' },
      env.JWT_SIGNING_SECRET,
      { algorithm: 'HS512' },
    );

    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(401);
    expect(body).toEqual({
      error: 'invalid_access_token',
      message: 'Access token payload is missing session_id.',
    });
  });

  test('valid bearer token and secret but with invalid session_id type', async () => {
    const accessToken = jsonwebtoken.sign(
      { session_id: 'not a uuid' },
      env.JWT_SIGNING_SECRET,
      { algorithm: 'HS512' },
    );

    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(401);
    expect(body).toEqual({
      error: 'invalid_access_token',
      message: 'Input type for session_id is not valid, expected UUID.',
    });
  });

  test('valid bearer token and secret but with invalid session_id', async () => {
    const accessToken = jsonwebtoken.sign(
      { session_id: uuid() },
      env.JWT_SIGNING_SECRET,
      { algorithm: 'HS512' },
    );

    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(401);
    expect(body).toEqual({
      error: 'invalid_access_token',
      message: 'No valid session found.',
    });
  });

  test('valid bearer token but token has been revoked', async () => {
    const session = await SessionEntity.create({
      applicationID: application.id,
    });

    const accessToken = jsonwebtoken.sign(
      { session_id: session.id },
      env.JWT_SIGNING_SECRET,
      { algorithm: 'HS512' },
    );

    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(401);
    expect(body).toEqual({
      error: 'expired_access_token',
      message: 'Access token has been revoked.',
    });
  });

  test('valid bearer token but token has expired', async () => {
    const session = await SessionEntity.create({
      applicationID: application.id,
      expiresAt: Sequelize.literal(
        `NOW() - INTERVAL '${ACCESS_TOKEN_TTL_HOURS} hours'`,
      ),
    });

    const accessToken = jsonwebtoken.sign(
      { session_id: session.id },
      env.JWT_SIGNING_SECRET,
      { algorithm: 'HS512' },
    );

    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(401);
    expect(body).toEqual({
      error: 'expired_access_token',
      message: 'Access token has expired.',
    });
  });

  test('valid bearer token', async () => {
    const session = await SessionEntity.create({
      applicationID: application.id,
      expiresAt: Sequelize.literal(
        `NOW() + INTERVAL '${ACCESS_TOKEN_TTL_HOURS} hours'`,
      ),
    });

    const accessToken = jsonwebtoken.sign(
      { session_id: session.id },
      env.JWT_SIGNING_SECRET,
      { algorithm: 'HS512' },
    );

    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
    });
  });
});
