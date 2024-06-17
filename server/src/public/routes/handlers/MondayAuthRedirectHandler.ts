import type { Request, Response } from 'express';

import {
  completeOAuthFlow,
  removeSubitemBoards,
} from 'server/src/third_party_tasks/monday/api.ts';
import { getOAuthCodeAndState } from 'server/src/auth/oauth.ts';
import { ThirdPartyConnectionEntity } from 'server/src/entity/third_party_connection/ThirdPartyConnectionEntity.ts';
import { APP_ORIGIN } from 'common/const/Urls.ts';
import { anonymousLogger, Logger } from 'server/src/logging/Logger.ts';
import { Viewer } from 'server/src/auth/index.ts';
import type { MondayConnectionPreferences } from 'common/types/index.ts';
import { UserPreferenceEntity } from 'server/src/entity/user_preference/UserPreferenceEntity.ts';
import { MONDAY_CONNECTION_PREFERENCES } from 'common/const/UserPreferenceKeys.ts';

export default async function MondayAuthRedirectHandler(
  req: Request,
  res: Response,
) {
  let logger = anonymousLogger();
  if (req.query['error'] === 'access_denied') {
    return res.redirect(
      `${APP_ORIGIN}/auth-error.html#service=monday&message=cancelled`,
    );
  }

  try {
    const codeAndState = getOAuthCodeAndState(req);

    const [code, { userID, orgID, type }] = codeAndState;
    logger = new Logger(Viewer.createLoggedInViewer(userID, orgID));

    if (type !== 'monday') {
      throw new Error(`incorrect redirect type, received ${type}`);
    }

    const [accessToken, userInfo] = await completeOAuthFlow(code);
    if (userInfo.me.id >= Number.MAX_SAFE_INTEGER) {
      logger.error(
        `Monday API returned ID of ${userInfo.me.id}, which may have been truncated`,
      );
    }
    const preferences: MondayConnectionPreferences = {
      boardID: removeSubitemBoards(userInfo.boards)[0].id,
    };

    await Promise.all([
      UserPreferenceEntity.upsert({
        userID,
        key: MONDAY_CONNECTION_PREFERENCES,
        value: preferences,
      }),
      ThirdPartyConnectionEntity.upsert({
        userID,
        orgID,
        type,
        // Use BigInt to prevent switching to exponential notation for large numbers
        externalID: BigInt(userInfo.me.id).toString(),
        externalEmail: userInfo.me.email,
        externalAuthData: {
          accessToken,
        },
      }),
    ]);
  } catch (e) {
    logger.logException(`MondayAuthRedirectHandler`, e);
    return res.redirect(
      `${APP_ORIGIN}/auth-error.html#service=monday&message=error`,
    );
  }

  return res.redirect(`${APP_ORIGIN}/auth-complete.html#service=monday`);
}
