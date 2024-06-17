import * as jsonwebtoken from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

import {
  ACCESS_TOKEN_CLOCK_TOLERANCE_SECONDS,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
} from 'common/const/Timing.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import {
  createPlatformApplication,
  createCustomer,
} from 'server/src/public/routes/tests/util.ts';
import type { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';

let customer: CustomerEntity;

let application: ApplicationEntity;

describe('VerifyAppServerAuthToken middleware present in expected routes', () => {
  beforeAll(async () => {
    application = await createPlatformApplication('platform app', 'secret');
  });

  const routes = [
    { endpoint: '/v1/organizations', method: 'POST' },
    { endpoint: '/v1/organizations/1', method: 'PUT' },
    { endpoint: '/v1/users', method: 'POST' },
    { endpoint: '/v1/users/1', method: 'PUT' },
    { endpoint: '/v1/batch/', method: 'POST' },
  ];

  routes.map((route) => {
    const { endpoint, method } = route;
    test(`${method} request for ${endpoint} with no authorization header`, async () => {
      const request =
        method === 'POST' ? apiCall().post(endpoint) : apiCall().put(endpoint);

      const { statusCode, body } = await request;

      expect(statusCode).toBe(401);
      expect(body).toEqual({
        error: 'missing_authorization_header',
        message: 'Authorization header bearer token must be present.',
      });
    });

    test(`${method} request for ${endpoint} with invalid bearer token`, async () => {
      const request =
        method === 'POST' ? apiCall().post(endpoint) : apiCall().put(endpoint);

      const { statusCode, body } = await request.set(
        'Authorization',
        'Bearer invalid',
      );

      expect(statusCode).toBe(401);
      expect(body).toMatchObject({
        error: 'invalid_authorization_header',
        message:
          'Input type for authorization header bearer token is not valid, expected JWT.',
      });
    });

    test(`${method} request for ${endpoint} with customer token, no app_id or project_id`, async () => {
      const request =
        method === 'POST' ? apiCall().post(endpoint) : apiCall().put(endpoint);

      const { statusCode, body } = await request.set(
        'Authorization',
        'Bearer ' + jsonwebtoken.sign({}, 'secret', { algorithm: 'HS512' }),
      );

      expect(statusCode).toBe(401);
      expect(body).toMatchObject({
        error: 'invalid_project_token',
        message:
          'Please include the project_id if you are authorizing directly with a non-Cord signed token.',
      });
    });

    test(`${method} request for ${endpoint} with customer token, bad app_id`, async () => {
      const request =
        method === 'POST' ? apiCall().post(endpoint) : apiCall().put(endpoint);

      const { statusCode, body } = await request.set(
        'Authorization',
        'Bearer ' +
          jsonwebtoken.sign({ app_id: 'ha, im not a uuid' }, 'secret', {
            algorithm: 'HS512',
          }),
      );

      expect(statusCode).toBe(401);
      expect(body).toMatchObject({
        error: 'invalid_project_token',
        message: 'Input type for project_id is not valid, expected UUID.',
      });
    });

    test(`${method} request for ${endpoint} with customer token, app_id and user field`, async () => {
      const request =
        method === 'POST' ? apiCall().post(endpoint) : apiCall().put(endpoint);

      const { statusCode, body } = await request.set(
        'Authorization',
        'Bearer ' +
          jsonwebtoken.sign(
            { app_id: application.id, user_id: 'some user id' },
            'secret',
            { algorithm: 'HS512' },
          ),
      );

      expect(statusCode).toBe(401);
      expect(body).toMatchObject({
        error: 'invalid_project_token',
        message:
          'Authorization token payload invalid, must contain only project_id.',
      });
    });

    test(`${method} request for ${endpoint} with customer token, project_id and user field`, async () => {
      const request =
        method === 'POST' ? apiCall().post(endpoint) : apiCall().put(endpoint);

      const { statusCode, body } = await request.set(
        'Authorization',
        'Bearer ' +
          jsonwebtoken.sign(
            { project_id: application.id, user_id: 'some user id' },
            'secret',
            { algorithm: 'HS512' },
          ),
      );

      expect(statusCode).toBe(401);
      expect(body).toMatchObject({
        error: 'invalid_project_token',
        message:
          'Authorization token payload invalid, must contain only project_id.',
      });
    });

    test(`${method} request for ${endpoint} with customer token, app_id and random field`, async () => {
      const request =
        method === 'POST' ? apiCall().post(endpoint) : apiCall().put(endpoint);

      const { statusCode, body } = await request.set(
        'Authorization',
        'Bearer ' +
          jsonwebtoken.sign(
            { app_id: application.id, random_garbage: 'llama' },
            'secret',
            { algorithm: 'HS512' },
          ),
      );

      expect(statusCode).toBe(401);
      expect(body).toMatchObject({
        error: 'invalid_project_token',
        message:
          'Authorization token payload invalid, must contain only project_id.',
      });
    });

    test(`${method} request for ${endpoint} with customer token signed with wrong secret`, async () => {
      const request =
        method === 'POST' ? apiCall().post(endpoint) : apiCall().put(endpoint);

      const { statusCode, body } = await request.set(
        'Authorization',
        'Bearer ' +
          jsonwebtoken.sign({ app_id: application.id }, 'other secret', {
            algorithm: 'HS512',
          }),
      );

      expect(statusCode).toBe(401);
      expect(body).toMatchObject({
        error: 'invalid_project_token',
        message: 'JsonWebTokenError: invalid signature',
      });
    });

    test(`${method} request for ${endpoint} with customer auth, valid token but max age exceeded`, async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const request =
        method === 'POST' ? apiCall().post(endpoint) : apiCall().put(endpoint);

      const { statusCode, body } = await request.set(
        'Authorization',
        'Bearer ' +
          jsonwebtoken.sign(
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
      );

      expect(statusCode).toBe(401);
      expect(body).toMatchObject({
        error: 'invalid_project_token',
        message: 'TokenExpiredError: maxAge exceeded',
      });
    });

    test(`${method} request for ${endpoint} with customer auth, valid token but app does not exist`, async () => {
      const request =
        method === 'POST' ? apiCall().post(endpoint) : apiCall().put(endpoint);

      const { statusCode, body } = await request.set(
        'Authorization',
        'Bearer ' +
          jsonwebtoken.sign({ app_id: uuid() }, 'secret', {
            algorithm: 'HS512',
          }),
      );

      expect(statusCode).toBe(401);
      expect(body).toEqual({
        error: 'project_not_found',
        message: 'Platform project not found.',
      });
    });

    test(`${method} request for ${endpoint} with customer auth, bad token syntax`, async () => {
      const request =
        method === 'POST' ? apiCall().post(endpoint) : apiCall().put(endpoint);

      const { statusCode, body } = await request.set(
        'Authorization',
        'bad syntax' +
          jsonwebtoken.sign({ app_id: uuid() }, 'secret', {
            algorithm: 'HS512',
          }),
      );

      expect(statusCode).toBe(401);
      expect(body).toEqual({
        error: 'invalid_authorization_header',
        message: 'Expecting a token with a Bearer prefix.',
      });
    });
  });
});

describe('VerifyCustomerServerAuthToken middleware present in expected routes', () => {
  beforeAll(async () => {
    customer = await createCustomer('test customer', 'secret');
  });

  const routes = [
    { endpoint: '/v1/applications', method: 'POST' },
    { endpoint: '/v1/projects', method: 'POST' },
  ];

  routes.map((route) => {
    const { endpoint, method } = route;
    test(`${method} request for ${endpoint} with no authorization header`, async () => {
      const { statusCode, body } = await await apiCall().post(endpoint);

      expect(statusCode).toBe(401);
      expect(body).toEqual({
        error: 'missing_authorization_header',
        message: 'Authorization header bearer token must be present.',
      });
    });

    test(`${method} request for ${endpoint} with invalid bearer token`, async () => {
      const { statusCode, body } = await apiCall()
        .post(endpoint)
        .set('Authorization', 'Bearer invalid');

      expect(statusCode).toBe(401);
      expect(body).toMatchObject({
        error: 'invalid_authorization_header',
        message:
          'Input type for authorization header bearer token is not valid, expected JWT.',
      });
    });

    test(`${method} request for ${endpoint} with customer token, bad customer_id`, async () => {
      const { statusCode, body } = await apiCall()
        .post(endpoint)
        .set(
          'Authorization',
          'Bearer ' +
            jsonwebtoken.sign({ customer_id: 'ha, im not a uuid' }, 'secret', {
              algorithm: 'HS512',
            }),
        );

      expect(statusCode).toBe(401);
      expect(body).toMatchObject({
        error: 'invalid_customer_token',
        message: 'Input type for customer_id is not valid, expected UUID.',
      });
    });

    test(`${method} request for ${endpoint} with customer token signed with wrong secret`, async () => {
      const { statusCode, body } = await apiCall()
        .post(endpoint)
        .set(
          'Authorization',
          'Bearer ' +
            jsonwebtoken.sign({ customer_id: customer.id }, 'other secret', {
              algorithm: 'HS512',
            }),
        );

      expect(statusCode).toBe(401);
      expect(body).toMatchObject({
        error: 'invalid_customer_token',
        message: 'JsonWebTokenError: invalid signature',
      });
    });

    test(`${method} request for ${endpoint} with customer auth, valid token but max age exceeded`, async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const { statusCode, body } = await apiCall()
        .post(endpoint)
        .set(
          'Authorization',
          'Bearer ' +
            jsonwebtoken.sign(
              {
                customer_id: customer.id,
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
        );

      expect(statusCode).toBe(401);
      expect(body).toMatchObject({
        error: 'invalid_customer_token',
        message: 'TokenExpiredError: maxAge exceeded',
      });
    });

    test(`${method} request for ${endpoint} with customer auth, valid token but customer does not exist`, async () => {
      const { statusCode, body } = await apiCall()
        .post(endpoint)
        .set(
          'Authorization',
          'Bearer ' +
            jsonwebtoken.sign({ customer_id: uuid() }, 'secret', {
              algorithm: 'HS512',
            }),
        );

      expect(statusCode).toBe(401);
      expect(body).toEqual({
        error: 'invalid_customer_token',
        message: 'Invalid customer token.',
      });
    });

    test(`${method} request for ${endpoint} with customer auth, bad token syntax`, async () => {
      const { statusCode, body } = await apiCall()
        .post(endpoint)
        .set(
          'Authorization',
          'bad syntax' +
            jsonwebtoken.sign({ customer_id: uuid() }, 'secret', {
              algorithm: 'HS512',
            }),
        );

      expect(statusCode).toBe(401);
      expect(body).toEqual({
        error: 'invalid_authorization_header',
        message: 'Expecting a token with a Bearer prefix.',
      });
    });
  });
});
