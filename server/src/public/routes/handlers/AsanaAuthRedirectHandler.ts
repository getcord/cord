import type { Request, Response } from 'express';

import { completeOAuthFlow } from 'server/src/third_party_tasks/asana/api.ts';
import { getOAuthCodeAndState } from 'server/src/auth/oauth.ts';
import { ThirdPartyConnectionEntity } from 'server/src/entity/third_party_connection/ThirdPartyConnectionEntity.ts';
import { ASANA_CONNECTION_PREFERENCES } from 'common/const/UserPreferenceKeys.ts';
import type { AsanaConnectionPreferences } from 'common/types/index.ts';
import { UserPreferenceEntity } from 'server/src/entity/user_preference/UserPreferenceEntity.ts';
import { APP_ORIGIN } from 'common/const/Urls.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';

export default async function AsanaAuthRedirectHandler(
  req: Request,
  res: Response,
) {
  if (req.query['error'] === 'access_denied') {
    return res.redirect(
      `${APP_ORIGIN}/auth-error.html#service=asana&message=cancelled`,
    );
  }

  try {
    const codeAndState = getOAuthCodeAndState(req);
    const [code, { userID, orgID, type }] = codeAndState;

    if (type !== 'asana') {
      throw new Error(`incorrect redirect type, received ${type}`);
    }

    const [refreshToken, asanaUserInfo] = await completeOAuthFlow(code);
    const externalID = asanaUserInfo.gid;
    const externalEmail = asanaUserInfo.email;
    const workspace = asanaUserInfo.workspaces?.[0]?.gid;

    if (!externalID || !externalEmail || !workspace) {
      throw new Error('Asana user gid/external_email/workspace is missing');
    }

    const preferences: AsanaConnectionPreferences = {
      projectID: undefined, // new tasks don't go to any project
    };

    await Promise.all([
      ThirdPartyConnectionEntity.upsert({
        userID,
        orgID,
        type,
        externalID,
        externalEmail,
        externalAuthData: {
          workspace,
          refreshToken,
        },
      }),
      UserPreferenceEntity.upsert({
        userID,
        key: ASANA_CONNECTION_PREFERENCES,
        value: preferences,
      }),
    ]);
  } catch (e) {
    anonymousLogger().logException(`AsanaAuthRedirectHandler`, e);
    return res.redirect(
      `${APP_ORIGIN}/auth-error.html#service=asana&message=error`,
    );
  }

  return res.redirect(`${APP_ORIGIN}/auth-complete.html#service=asana`);
}
