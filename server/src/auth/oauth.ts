import * as crypto from 'crypto';

import type { Request } from 'express';
import { sign, verify } from 'jsonwebtoken';

import {
  API_SERVER_HOST,
  API_SERVER_HOST_PRODUCTION,
} from 'common/const/Urls.ts';
import type {
  SlackOAuthConsoleUserState,
  SlackOAuthDecodeState,
  SlackOAuthLinkOrgState,
} from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasIdentity } from 'server/src/auth/index.ts';
import env from 'server/src/config/Env.ts';
import type { ThirdPartyConnectionType } from 'server/src/schema/resolverTypes.ts';

type ThirdPartyConnectionState = {
  userID: string;
  orgID: string;
  type: ThirdPartyConnectionType;

  // For JIRA, the auth callback always points to production. If you want to log
  // in on another instance, we sent the api hostname of that instance in the
  // `development` field and then redirect there from production.
  development?: string;
};

export function encodeViewerForOAuthState(
  viewer: Viewer,
  type: ThirdPartyConnectionType,
) {
  const { userID, orgID } = assertViewerHasIdentity(viewer);
  const state: ThirdPartyConnectionState = {
    userID,
    orgID,
    type,
  };

  if (API_SERVER_HOST !== API_SERVER_HOST_PRODUCTION) {
    state['development'] = API_SERVER_HOST;
  }

  return sign(state, env.OAUTH_STATE_SIGNING_SECRET);
}

export function decodeViewerFromOAuthState(token: string) {
  return verify(
    token,
    env.OAUTH_STATE_SIGNING_SECRET,
  ) as ThirdPartyConnectionState;
}

export function getOAuthCodeAndState(
  req: Request,
): [string, ThirdPartyConnectionState] {
  const { code, state } = req.query;
  if (!code || !state) {
    throw new Error(`missing code or state`);
  }

  let stateData: ThirdPartyConnectionState | null = null;
  try {
    stateData = decodeViewerFromOAuthState(state as string);
  } catch (e) {
    throw new Error(`decodeViewerFromOAuthState failed`);
  }

  if (!stateData) {
    throw new Error(`missing state data`);
  }
  return [code as string, stateData];
}

function encryptSlackOAuthState(state: string) {
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    env.SLACK_OAUTH_STATE_SIGNING_SECRET,
    iv,
  );

  const encrypted = Buffer.concat([
    cipher.update(state, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    encrypted.toString('hex'),
    authTag.toString('hex'),
    iv.toString('hex'),
  ].join(':');
}

function decryptSlackOAuthState(token: string) {
  const [encrypted, authTag, iv] = token.split(':');

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    env.SLACK_OAUTH_STATE_SIGNING_SECRET,
    Buffer.from(iv, 'hex'),
  );

  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final();
  return decrypted;
}

export function encodeSlackOAuthState(state: SlackOAuthDecodeState) {
  return encryptSlackOAuthState(JSON.stringify(state));
}

type DecodedState = {
  type: unknown;
  nonce: unknown;
  data: unknown;
};

export function decodeSlackOAuthState(state: string): SlackOAuthDecodeState {
  const decodedState = JSON.parse(decryptSlackOAuthState(state));
  if (typeof decodedState !== 'object') {
    throw new Error(`Unexpected Slack OAuth State format: ${state}`);
  }

  if (!decodedState?.type || !decodedState?.nonce || !decodedState?.data) {
    throw new Error(`Unexpected Slack OAuth State format: ${state}`);
  }

  // Connecting Slack to SDK user/org
  if (decodedState.type === 'link_org') {
    return decodeSlackOAuthLinkOrgDataState(decodedState);
  }

  // Connecting Slack from console for support bot
  if (decodedState.type === 'console_user') {
    return decodeSlackOAuthConsoleUserDataState(decodedState);
  }

  throw new Error(`unknown type: ${decodedState.type}`);
}

function decodeSlackOAuthLinkOrgDataState(
  decodedState: DecodedState,
): SlackOAuthLinkOrgState {
  if (decodedState.type !== 'link_org') {
    throw new Error(
      `Decoded slack state type is not link_org: ${decodedState}`,
    );
  }

  if (typeof decodedState.nonce !== 'string') {
    throw new Error(
      `Decoded slack state nonce is not a string: ${decodedState}`,
    );
  }

  if (typeof decodedState.data !== 'object') {
    throw new Error(
      `Decoded slack state data is not an object: ${decodedState}`,
    );
  }

  const dataState = decodedState.data as {
    userID: unknown;
    orgID: unknown;
    platformApplicationID: unknown;
  };

  if (typeof dataState.userID !== 'string') {
    throw new Error(
      `Decoded slack state data userID is not a string: ${decodedState}`,
    );
  }

  if (typeof dataState.orgID !== 'string') {
    throw new Error(
      `Decoded slack state data orgID is not a string: ${decodedState}`,
    );
  }

  if (typeof dataState.platformApplicationID !== 'string') {
    throw new Error(
      `Decoded slack state data platformApplicationID is not a string: ${decodedState}`,
    );
  }

  return {
    type: decodedState.type,
    nonce: decodedState.nonce,
    data: {
      userID: dataState.userID,
      orgID: dataState.orgID,
      platformApplicationID: dataState.platformApplicationID,
    },
  };
}

function decodeSlackOAuthConsoleUserDataState(
  decodedState: DecodedState,
): SlackOAuthConsoleUserState {
  if (decodedState.type !== 'console_user') {
    throw new Error(
      `Decoded slack state type is not console_user: ${decodedState}`,
    );
  }

  if (typeof decodedState.nonce !== 'string') {
    throw new Error(
      `Decoded slack state nonce is not a string: ${decodedState}`,
    );
  }

  if (typeof decodedState.data !== 'object') {
    throw new Error(
      `Decoded slack state data is not an object: ${decodedState}`,
    );
  }

  const dataState = decodedState.data as {
    platformApplicationID: unknown;
  };

  if (typeof dataState.platformApplicationID !== 'string') {
    throw new Error(
      `Decoded slack state data platformApplicationID is not a string: ${decodedState}`,
    );
  }

  return {
    type: decodedState.type,
    nonce: decodedState.nonce,
    data: {
      platformApplicationID: dataState.platformApplicationID,
    },
  };
}
