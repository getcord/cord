import type { Request, Response } from 'express';

import { TRELLO_CONNECTED_LIST } from 'common/const/UserPreferenceKeys.ts';
import {
  getLoginURLWithRequestToken,
  completeOAuthFlow,
} from 'server/src/third_party_tasks/trello/api.ts';
import { decodeViewerFromOAuthState } from 'server/src/auth/oauth.ts';
import { ThirdPartyConnectionEntity } from 'server/src/entity/third_party_connection/ThirdPartyConnectionEntity.ts';
import { APP_ORIGIN } from 'common/const/Urls.ts';
import { UserPreferenceEntity } from 'server/src/entity/user_preference/UserPreferenceEntity.ts';
import { anonymousLogger, Logger } from 'server/src/logging/Logger.ts';
import { Viewer } from 'server/src/auth/index.ts';

export async function TrelloAuthRedirectHandler(req: Request, res: Response) {
  let logger = anonymousLogger();
  if (req.query['error'] === 'access_denied') {
    return res.redirect(
      `${APP_ORIGIN}/auth-error.html#service=trello&message=cancelled`,
    );
  }

  try {
    const { oauth_token, oauth_verifier } = req.query;
    if (!oauth_token || !oauth_verifier) {
      throw new Error(`missing token or verifier`);
    }

    const [authData, state, userResources] = await completeOAuthFlow(
      oauth_token as string,
      oauth_verifier as string,
    );

    const { userID, orgID, type } = decodeViewerFromOAuthState(state);
    logger = new Logger(Viewer.createLoggedInViewer(userID, orgID));
    if (type !== 'trello') {
      throw new Error(`incorrect redirect type, received ${type}`);
    }

    const { accessToken, accessTokenSecret } = authData;
    const { id, email, boards } = userResources;

    if (!id || !email) {
      throw new Error('Trello user id or email not found.');
    }

    const firstBoardWithList = boards.find((board) => board.lists.length > 1);
    if (!firstBoardWithList) {
      throw new Error('Trello user has no boards.');
    }

    const listID = firstBoardWithList.lists[0].id;

    await Promise.all([
      UserPreferenceEntity.upsert({
        userID,
        key: TRELLO_CONNECTED_LIST,
        value: listID,
      }),
      ThirdPartyConnectionEntity.upsert({
        userID,
        orgID,
        type,
        externalID: id,
        externalEmail: email,
        externalAuthData: {
          accessToken,
          accessTokenSecret,
        },
      }),
    ]);
  } catch (e) {
    logger.logException(`TrelloAuthRedirectHandler`, e);
    return res.redirect(
      `${APP_ORIGIN}/auth-error.html#service=trello&message=error`,
    );
  }

  return res.redirect(`${APP_ORIGIN}/auth-complete.html#service=trello`);
}

export function TrelloAuthLoginHandler(req: Request, res: Response) {
  getLoginURLWithRequestToken(req, res);
}
