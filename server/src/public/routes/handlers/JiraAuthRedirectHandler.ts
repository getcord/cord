import type { Request, Response } from 'express';
import { getOAuthCodeAndState } from 'server/src/auth/oauth.ts';
import { completeOAuthFlow } from 'server/src/third_party_tasks/jira/api.ts';
import { ThirdPartyConnectionEntity } from 'server/src/entity/third_party_connection/ThirdPartyConnectionEntity.ts';
import { APP_ORIGIN } from 'common/const/Urls.ts';
import { UserPreferenceEntity } from 'server/src/entity/user_preference/UserPreferenceEntity.ts';
import { JIRA_CONNECTION_PREFERENCES } from 'common/const/UserPreferenceKeys.ts';
import type { JiraConnectionPreferences } from 'common/types/index.ts';
import { anonymousLogger, Logger } from 'server/src/logging/Logger.ts';
import { Viewer } from 'server/src/auth/index.ts';

export default async function JiraAuthRedirectHandler(
  req: Request,
  res: Response,
) {
  let logger = anonymousLogger();
  if (req.query['error'] === 'access_denied') {
    return res.redirect(
      `${APP_ORIGIN}/auth-error.html#service=jira&message=cancelled`,
    );
  }

  try {
    const codeAndState = getOAuthCodeAndState(req);

    const [code, { userID, orgID, type, development }] = codeAndState;
    logger = new Logger(Viewer.createLoggedInViewer(userID, orgID));

    if (development && process.env.NODE_ENV !== 'development') {
      // this login flow was initiated from a local dev server so let's redirect the user there
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      const { code, state } = req.query;
      return res.redirect(
        `https://${development}/auth/jira/redirect/?code=${encodeURIComponent(
          code as string,
        )}&state=${encodeURIComponent(state as string)}`,
      );
    }

    if (type !== 'jira') {
      throw new Error(`incorrect redirect type, received ${type}`);
    }

    const { refreshToken, identity, cloudID, projects } =
      await completeOAuthFlow(code);

    const externalID = identity.account_id;
    const externalEmail = identity.email;

    if (projects.length === 0) {
      throw new Error('Jira user has no projects');
    }

    const projectID = projects[0].id;
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    const issueType = projects[0].issueTypes.find((type) => !type.subtask)?.id;
    const subissueType = projects[0].issueTypes.find(
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      (type) => type.subtask,
    )?.id;

    if (!issueType || !subissueType) {
      throw new Error('Jira user has no issue or subissue type');
    }

    const preferences: JiraConnectionPreferences = {
      projectID,
      issueType,
      subissueType,
    };

    await Promise.all([
      UserPreferenceEntity.upsert({
        userID,
        key: JIRA_CONNECTION_PREFERENCES,
        value: preferences,
      }),
      ThirdPartyConnectionEntity.upsert({
        userID,
        orgID,
        type,
        externalID,
        externalEmail,
        externalAuthData: {
          cloudID,
          refreshToken,
        },
      }),
    ]);
  } catch (e) {
    logger.logException(`JiraAuthRedirectHandler`, e);
    return res.redirect(
      `${APP_ORIGIN}/auth-error.html#service=jira&message=error`,
    );
  }

  return res.redirect(`${APP_ORIGIN}/auth-complete.html#service=jira`);
}
