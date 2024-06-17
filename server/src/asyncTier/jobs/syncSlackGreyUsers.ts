import type { UUID } from 'common/types/index.ts';
import { AsyncTierJobDefinition } from 'server/src/asyncTier/jobDefinition.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type { Logger } from 'server/src/logging/Logger.ts';
import { fetchSlackUsersList } from 'server/src/slack/api.ts';
import {
  allowImportUser,
  updateOrCreateSlackUserProfile,
} from 'server/src/slack/util.ts';

const MAX_SLACK_USERS_PER_BATCH = 100;

export default new AsyncTierJobDefinition(
  'syncSlackGreyUsers',
  syncSlackGreyUsers,
);

type SyncSlackGreyUsers = { orgID: UUID };

async function syncSlackGreyUsers(data: SyncSlackGreyUsers, logger: Logger) {
  logger.info('Starting Slack org grey users sync');
  const { orgID } = data;

  try {
    const org = await OrgEntity.findByPk(orgID);

    // this should never throw...
    if (!org) {
      throw new Error('Org does not exist');
    }

    const viewer = Viewer.createOrgViewer(org.id);
    logger = logger.childLogger(viewer, {
      id: org.id,
      externalId: org.externalID,
      appId: org.platformApplicationID,
      name: org.name,
    });

    const slackBotCredentials = await org.getSlackBotCredentials();
    if (!slackBotCredentials) {
      logger.warn('syncSlackGreyUsers: no SlackBotCredentials');
      return;
    }
    const { bot_access_token } = slackBotCredentials;

    const membersToAdd = (await fetchSlackUsersList(bot_access_token))
      // filter out Slack bots
      // and any users sent to us by Slack who are not part of the Slack org
      .filter(allowImportUser)
      .filter((member) => member.team_id === org.externalID)
      // Sync the nondeleted users first, since they're more likely useful
      .sort((a, b) => Number(a.deleted) - Number(b.deleted));

    for (
      let offset = 0;
      offset < membersToAdd.length;
      offset += MAX_SLACK_USERS_PER_BATCH
    ) {
      // create grey profiles for other team members if necessary
      // and update any changed details of existing slack/cord users
      await Promise.all(
        membersToAdd.slice(offset, offset + MAX_SLACK_USERS_PER_BATCH).map(
          // account is inactive and we don't know their access token
          (member) => updateOrCreateSlackUserProfile(org, member),
        ),
      );
    }
  } catch (error: unknown) {
    logger.logException('Error updating Slack grey users', error, {
      orgID,
    });
  }
}
