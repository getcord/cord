import * as url from 'url';
import * as Slack from '@slack/web-api';
import type { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import * as cookie from 'cookie';

import env from 'server/src/config/Env.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { encodeSessionToJWT } from 'server/src/auth/encodeSessionToJWT.ts';
import { OrgLoader } from 'server/src/entity/org/OrgLoader.ts';
import { ADMIN_SERVER_HOST, APP_ORIGIN } from 'common/const/Urls.ts';
import { getAuthorizationHeaderWithToken } from 'common/auth/index.ts';
import {
  CORD_SLACK_TEAM_ID,
  SLACK_ADMIN_LOGIN_APP_CLIENT_ID,
  SLACK_ADMIN_LOGIN_APP_ID,
} from 'common/const/Ids.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { UserLoader } from 'server/src/entity/user/UserLoader.ts';

const slackClient = new Slack.WebClient();

export const SLACK_LOGIN_ROUTE = 'login/slack';

// there's a weird kink in the Slack openid flow, where redirect URLs with ports in them
// trigger a generic error page, so unfortunately when initiating the login from localhost
// we have to set the redirect URL to admin.cord.com, which then redirects to the actual
// localhost URL based on the `host` field found in the state object
export const ADMIN_LOGIN_SLACK_REDIRECT_URL = url.format({
  protocol: 'https',
  host: env.SLACK_ADMIN_LOGIN_REDIRECT_HOST || ADMIN_SERVER_HOST,
  pathname: SLACK_LOGIN_ROUTE,
});

const ADMIN_SESSION_EXPIRATION_SECONDS = 60 * 60 * 24; // valid for 24 hours

export default async function SlackLoginHandler(req: Request, res: Response) {
  const { code, state } = req.query;
  if (typeof state !== 'string' || typeof code !== 'string') {
    return res.redirect(APP_ORIGIN);
  }

  let finalDestination: string | undefined = undefined;

  try {
    const { host, redirect_to } = jwt.verify(
      state,
      env.OAUTH_STATE_SIGNING_SECRET,
      {
        algorithms: ['HS512'],
      },
    ) as { host: string; redirect_to?: string };

    if (host !== ADMIN_SERVER_HOST) {
      return res.redirect(
        url.format({
          protocol: 'https',
          host,
          pathname: SLACK_LOGIN_ROUTE,
          query: { code, state },
        }),
      );
    }
    finalDestination = redirect_to;
  } catch (e) {
    anonymousLogger().logException(
      'SlackLoginHandler',
      e,
      undefined,
      undefined,
      'warn',
    );
    return res.redirect(APP_ORIGIN);
  }

  const cookieNonce = cookie.parse(req.header('Cookie') || '')[
    'admin_nonce'
  ] as string | undefined;
  if (!cookieNonce) {
    anonymousLogger().warn('SlackLoginHandler', {
      message: 'missing admin_nonce cookie',
    });

    return res.redirect(APP_ORIGIN);
  }

  try {
    const response = await slackClient.openid.connect.token({
      code,
      client_id: SLACK_ADMIN_LOGIN_APP_CLIENT_ID,
      client_secret: env.SLACK_ADMIN_CLIENT_SECRET,
      redirect_uri: ADMIN_LOGIN_SLACK_REDIRECT_URL,
    });

    if (!response.ok || !response.id_token) {
      anonymousLogger().warn('SlackLoginHandler', {
        message: 'slack oauth failed',
        ...response,
      });

      return res.redirect(APP_ORIGIN);
    }

    const userInfo = jwt.decode(response.id_token) as { [key: string]: string };
    const {
      'https://slack.com/user_id': user_id,
      'https://slack.com/team_id': team_id,
      nonce,
    } = userInfo;

    if (nonce !== cookieNonce) {
      anonymousLogger().warn('SlackLoginHandler', {
        message: 'wrong nonce',
      });

      return res.redirect(APP_ORIGIN);
    }

    if (team_id !== CORD_SLACK_TEAM_ID) {
      anonymousLogger().warn('SlackLoginHandler', {
        message: `logged in with wrong slack team ${team_id}`,
      });

      return res.redirect(APP_ORIGIN);
    }

    const org = await new OrgLoader(Viewer.createServiceViewer()).loadSlackOrg(
      team_id,
      SLACK_ADMIN_LOGIN_APP_ID,
    );

    if (!org) {
      anonymousLogger().warn('SlackLoginHandler', {
        message: `org not found for team ${team_id}`,
      });

      return res.redirect(APP_ORIGIN);
    }

    const user = await new UserLoader(
      Viewer.createOrgViewer(org.id),
      () => null,
    ).loadUserForSlackUserWithinViewerOrg(user_id);

    if (!user) {
      anonymousLogger().warn('SlackLoginHandler', {
        message: `user not found for user ${user_id} in org ${org.id}`,
      });

      return res.redirect(APP_ORIGIN);
    }

    if (!user?.admin) {
      anonymousLogger().warn('SlackLoginHandler', {
        message: `user ${user_id} not found or not admin`,
      });

      return res.redirect(APP_ORIGIN);
    }

    const token = encodeSessionToJWT(
      {
        viewer: Viewer.createLoggedInViewer(user.id, org.id),
      },
      ADMIN_SESSION_EXPIRATION_SECONDS,
    );

    return res
      .cookie('admin_nonce', '', {
        maxAge: 0,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      })
      .cookie('token', getAuthorizationHeaderWithToken(token), {
        httpOnly: true, // prevent the cookie from being readable on the client-side
        secure: true, // only on https
        sameSite: 'lax', // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite#lax
        maxAge: 1000 * ADMIN_SESSION_EXPIRATION_SECONDS,
      })
      .redirect(finalDestination ?? '/');
  } catch (e) {
    anonymousLogger().logException(
      'SlackLoginHandler',
      e,
      undefined,
      undefined,
      'warn',
    );
    return res.redirect(APP_ORIGIN);
  }
}
