import { Errors } from 'common/const/Errors.ts';
import type { EmptyJsonObject } from 'common/types/index.ts';
import { AsyncTierJobDefinition } from 'server/src/asyncTier/jobDefinition.ts';
import { Viewer } from 'server/src/auth/index.ts';
import type { JiraAuthData } from 'server/src/entity/third_party_connection/ThirdPartyConnectionEntity.ts';
import { ThirdPartyConnectionEntity } from 'server/src/entity/third_party_connection/ThirdPartyConnectionEntity.ts';
import type { Logger } from 'server/src/logging/Logger.ts';
import { fetchAccessToken } from 'server/src/third_party_tasks/jira/api.ts';
import { removeExternalConnection } from 'server/src/third_party_tasks/util.ts';

export default new AsyncTierJobDefinition(
  'rotateJiraRefreshTokens',
  rotateAllJiraRefreshTokens,
).schedule({
  tier: 'staging',
  name: 'weekly',
  cron: '0 6 * * 3', // 6am every Wednesday https://crontab.guru/#0_6_*_*_3
  data: {},
});

// Jira is moving to rotating refresh tokens. That means that a refreshToken we
// receive from Jira will be valid (ie. allowed to be exchanged for an
// accessToken) only for 30 days. Also, when a refreshToken is exchanged for an
// accessToken, Jira will also send us a new refreshToken and the old one
// becomes invalid. The purpose of this job is to periodically fetch JIRA
// accessToken and thus rotate the refreshTokens we store.
//
// https://community.developer.atlassian.com/t/4-aug-2021-action-required-deprecating-persistent-refresh-tokens/50348
async function rotateAllJiraRefreshTokens(
  _: EmptyJsonObject,
  jobLogger: Logger,
) {
  const jiraConnections = await ThirdPartyConnectionEntity.findAll({
    where: {
      type: 'jira',
    },
  });
  jobLogger.debug(`Found ${jiraConnections.length} jira connections`);
  await Promise.all(
    jiraConnections.map(async (jiraConnection) => {
      const viewer = Viewer.createLoggedInViewer(
        jiraConnection.userID,
        jiraConnection.orgID,
      );
      const externalData = jiraConnection.externalAuthData as JiraAuthData;
      const logger = jobLogger.childLogger(viewer, externalData);
      try {
        logger.debug('Going to rotate JIRA refreshToken');
        await fetchAccessToken(
          viewer,
          externalData.refreshToken,
          externalData.cloudID,
        );
        logger.debug('Successfully rotated refreshToken');
      } catch (e: unknown) {
        const deleteConnection =
          getErrorMessage(e) === Errors.EXTERNAL_API_FORBIDDEN_RESPONSE;
        logger.logException('Failed to rotate JIRA refreshToken', e);
        if (deleteConnection) {
          await removeExternalConnection(viewer, 'jira');
        }
      } finally {
        logger.debug('Done rotating JIRA refreshToken');
      }
    }),
  );
}

function getErrorMessage(e: unknown): string | undefined {
  if (
    typeof e === 'object' &&
    e !== null &&
    'message' in e &&
    typeof (e as any).message === 'string'
  ) {
    return (e as any).message;
  }
  return undefined;
}
