import type { Request, Response } from 'express';

import { LINEAR_CONNECTION_PREFERENCES } from 'common/const/UserPreferenceKeys.ts';
import {
  completeOAuthFlow,
  createWebhook,
} from 'server/src/third_party_tasks/linear/api.ts';
import { getOAuthCodeAndState } from 'server/src/auth/oauth.ts';
import { ThirdPartyConnectionEntity } from 'server/src/entity/third_party_connection/ThirdPartyConnectionEntity.ts';
import { UserPreferenceEntity } from 'server/src/entity/user_preference/UserPreferenceEntity.ts';
import { APP_ORIGIN, API_SERVER_HOST_PRODUCTION } from 'common/const/Urls.ts';
import type { LinearConnectionPreferences } from 'common/types/index.ts';
import { LINEAR_EVENTS_PATH } from 'server/src/public/routes/MainRouter.ts';
import { anonymousLogger, Logger } from 'server/src/logging/Logger.ts';
import { Viewer } from 'server/src/auth/index.ts';

export default async function LinearAuthRedirectHandler(
  req: Request,
  res: Response,
) {
  let logger = anonymousLogger();
  if (req.query['error'] === 'access_denied') {
    return res.redirect(
      `${APP_ORIGIN}/auth-error.html#service=linear&message=cancelled`,
    );
  }

  try {
    const codeAndState = getOAuthCodeAndState(req);

    const [code, { userID, orgID, type }] = codeAndState;
    logger = new Logger(Viewer.createLoggedInViewer(userID, orgID));

    if (type !== 'linear') {
      throw new Error(`incorrect redirect type, received ${type}`);
    }

    const [accessToken, linearUserInfo] = await completeOAuthFlow(code);

    const externalID = linearUserInfo.id;
    const externalEmail = linearUserInfo.email;
    const teams = linearUserInfo.teams.nodes as
      | Array<{
          id: string;
          name: string;
          projects: {
            nodes: {
              id: string;
              name: string;
            }[];
          };
        }>
      | undefined;

    if (!teams) {
      throw new Error('Failed to find any Linear teams.');
    }

    const teamID = teams[0].id;

    if (!externalID || !externalEmail) {
      throw new Error('Linear user id or email not found.');
    }

    if (!teamID) {
      throw new Error('Linear user is not part of a team.');
    }

    const preferences: LinearConnectionPreferences = {
      teamID,
    };

    const teamIDs = teams.map((teamInfo) => teamInfo.id);

    const url = `https://${API_SERVER_HOST_PRODUCTION}${LINEAR_EVENTS_PATH}`;
    const resourceTypes = ['Issue'];
    const label = 'Created by Cord';

    await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      teamIDs.map((teamID) =>
        createWebhook(accessToken, teamID, url, resourceTypes, label),
      ),
    );

    await Promise.all([
      UserPreferenceEntity.upsert({
        userID,
        key: LINEAR_CONNECTION_PREFERENCES,
        value: preferences,
      }),
      ThirdPartyConnectionEntity.upsert({
        userID,
        orgID,
        type,
        externalID,
        externalEmail,
        externalAuthData: {
          accessToken,
        },
      }),
    ]);
  } catch (e) {
    logger.logException(`LinearAuthRedirectHandler`, e);
    return res.redirect(
      `${APP_ORIGIN}/auth-error.html#service=linear&message=error`,
    );
  }

  return res.redirect(`${APP_ORIGIN}/auth-complete.html#service=linear`);
}
