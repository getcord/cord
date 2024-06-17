import type { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import type { ClientAuthTokenData } from '@cord-sdk/types';

import env from 'server/src/config/Env.ts';

// this is copied over from @cord-sdk/server to be able to change its implementation to allow
// passing in a custom expiration, without afffecting the public version of this function
function getClientAuthToken(
  app_id: string,
  app_secret: string,
  payload: Omit<ClientAuthTokenData, 'app_id' | 'project_id'>,
  expiresIn = '1 min',
): string {
  return jwt.sign({ ...payload, app_id }, app_secret, {
    algorithm: 'HS512',
    expiresIn,
  });
}

const APP_ID = 'b6501bf5-46f7-4db7-9996-c42dd9f758b0';
const APP_SECRET = 'cordrulez';

const USER_DETAILS = {
  andrei: {
    email: env.TESTBED_USERS_EMAIL ?? 'notification-spam+andrei@cord.com',
    profile_picture_url:
      'https://ca.slack-edge.com/T012Y0TBQLW-U0134UJMCG3-da029c9556f6-512',
    name: 'Andrei',
  },
  flooey: {
    email: env.TESTBED_USERS_EMAIL ?? 'notification-spam+flooey@cord.com',
    profile_picture_url:
      'https://ca.slack-edge.com/T012Y0TBQLW-U02D2DNCS3H-71dafa543b5d-512',
    name: 'Flooey',
  },
  nimrod: {
    email: env.TESTBED_USERS_EMAIL ?? 'notification-spam+np@cord.com',
    profile_picture_url:
      'https://avatars.slack-edge.com/2020-05-06/1107128068275_13105bc2580f354aa611_original.png',
    name: 'Nimrod Priell, the CEO',
  },
} as const;

const ORG_DETAILS = {
  cord: {
    name: 'Cord',
  },
  secondorg: {
    name: 'Test Org 2',
  },
  thirdorg: {
    name: 'Test Org 3',
  },
} as const;

function clientAuthBody(
  user: keyof typeof USER_DETAILS,
  org?: keyof typeof ORG_DETAILS,
) {
  return {
    user_id: user,
    organization_id: org,
    user_details: USER_DETAILS[user],
    ...(org && { organization_details: ORG_DETAILS[org] }),
  };
}

export default function TestbedTokensHandler(_req: Request, res: Response) {
  const tokens = {
    andrei: getClientAuthToken(
      APP_ID,
      APP_SECRET,
      clientAuthBody('andrei', 'cord'),
    ),
    flooey: getClientAuthToken(
      APP_ID,
      APP_SECRET,
      clientAuthBody('flooey', 'cord'),
    ),
    nimrod: getClientAuthToken(
      APP_ID,
      APP_SECRET,
      clientAuthBody('nimrod', 'cord'),
    ),
    andrei_in_second_org: getClientAuthToken(
      APP_ID,
      APP_SECRET,
      clientAuthBody('andrei', 'secondorg'),
    ),
    flooey_in_second_org: getClientAuthToken(
      APP_ID,
      APP_SECRET,
      clientAuthBody('flooey', 'secondorg'),
    ),
    nimrod_in_second_org: getClientAuthToken(
      APP_ID,
      APP_SECRET,
      clientAuthBody('nimrod', 'secondorg'),
    ),
    andrei_in_third_org: getClientAuthToken(
      APP_ID,
      APP_SECRET,
      clientAuthBody('andrei', 'thirdorg'),
    ),
    flooey_in_third_org: getClientAuthToken(
      APP_ID,
      APP_SECRET,
      clientAuthBody('flooey', 'thirdorg'),
    ),
    invalid_user_details: getClientAuthToken(APP_ID, APP_SECRET, {
      user_id: 'invalid_user_details',
      organization_id: 'cord',
      user_details: {
        name: 'invalid_user_details',
        // don't include email on purpose
      } as any,
    }),
    andrei2: getClientAuthToken(
      APP_ID,
      APP_SECRET,
      clientAuthBody('andrei', 'cord'),
      // expires in 2 min; this is to make it different from the andrei token
      '2 min',
    ),
    andrei_without_org: getClientAuthToken(
      APP_ID,
      APP_SECRET,
      clientAuthBody('andrei'),
    ),
    flooey_without_org: getClientAuthToken(
      APP_ID,
      APP_SECRET,
      clientAuthBody('flooey'),
    ),
    nimrod_without_org: getClientAuthToken(
      APP_ID,
      APP_SECRET,
      clientAuthBody('nimrod'),
    ),
    missing_user: getClientAuthToken(APP_ID, APP_SECRET, {
      user_id: 'nobody-that-exists',
    }),
  };

  res.setHeader(
    'Access-Control-Allow-Origin',
    `https://${env.APP_SERVER_HOST}`,
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  return res.status(200).json(tokens);
}
