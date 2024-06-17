import * as jwt from 'jsonwebtoken';
import type { ClientAuthTokenData } from '@cord-sdk/types';

export type { ClientAuthTokenData };

export type CommonAuthTokenOptions = {
  /**
   * How long until the token expires.  If not set, defaults to 1 minute.
   */
  expires?: jwt.SignOptions['expiresIn'];
};

export type GetClientAuthTokenOptions = CommonAuthTokenOptions;

export type GetServerAuthTokenOptions = CommonAuthTokenOptions;

export type GetApplicationManagementAuthTokenOptions = CommonAuthTokenOptions;

export function getClientAuthToken(
  project_id: string,
  project_secret: string,
  payload: Omit<ClientAuthTokenData, 'app_id' | 'project_id'>,
  options: GetClientAuthTokenOptions = {},
): string {
  if (!payload || !payload.user_id) {
    // You can't get here in TS -- it's a TS type error -- but not everyone uses
    // TS.
    throw new Error(
      'Missing user_id. ' +
        'A token without a user_id can be misinterpreted as an administrative server auth token ' +
        '(which should never be given to clients). ' +
        'If you intended to generate a server auth token, call getServerAuthToken instead.',
    );
  }

  return jwt.sign({ ...payload, project_id }, project_secret, {
    algorithm: 'HS512',
    expiresIn: options.expires ?? '1 min',
  });
}

export function getServerAuthToken(
  project_id: string,
  project_secret: string,
  options: GetServerAuthTokenOptions = {},
): string {
  return jwt.sign({ app_id: project_id }, project_secret, {
    algorithm: 'HS512',
    expiresIn: options.expires ?? '1 min',
  });
}

export function getApplicationManagementAuthToken(
  customer_id: string,
  customer_secret: string,
  options: GetApplicationManagementAuthTokenOptions = {},
): string {
  return jwt.sign({ customer_id }, customer_secret, {
    algorithm: 'HS512',
    expiresIn: options.expires ?? '1 min',
  });
}

export function getProjectManagementAuthToken(
  customer_id: string,
  customer_secret: string,
): string {
  return jwt.sign({ customer_id }, customer_secret, {
    algorithm: 'HS512',
    expiresIn: '1 min',
  });
}
