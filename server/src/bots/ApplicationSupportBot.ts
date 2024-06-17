import type { UUID } from 'common/types/index.ts';
import { assertViewerHasIdentity } from 'server/src/auth/index.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { addCordBotToSlackChannels } from 'server/src/slack/api.ts';
import { addThreadToSelectedSlackChannel } from 'server/src/slack/util.ts';

async function getApplicationSupportSlackOrgBotCredentials(supportOrgID: UUID) {
  const supportOrg = await OrgEntity.findByPk(supportOrgID);

  if (!supportOrg) {
    throw new Error('No application support org found');
  }

  const slackBotCredentials = await supportOrg.getSlackBotCredentials();

  if (!slackBotCredentials) {
    throw new Error(
      'No slack bot credentials found for application support bot',
    );
  }

  return slackBotCredentials;
}

export async function shareThreadToApplicationSupportSlackChannel(
  application: ApplicationEntity,
  context: RequestContext,
  threadID: UUID,
) {
  const slackChannelID = application.supportSlackChannelID;
  const supportOrgID = application.supportOrgID;
  const { userID, orgID } = assertViewerHasIdentity(context.session.viewer);

  try {
    if (!slackChannelID) {
      throw new Error('No support slack channel ID');
    }

    if (!supportOrgID) {
      throw new Error('No support slack org ID');
    }

    const slackBotCredentials =
      await getApplicationSupportSlackOrgBotCredentials(supportOrgID);

    const sharerUser =
      await context.loaders.userLoader.loadUserInAnyViewerOrg(userID);

    if (!sharerUser) {
      throw new Error('Missing valid sharerUser');
    }

    await addCordBotToSlackChannels(
      context,
      slackBotCredentials.bot_access_token,
      [slackChannelID],
    );

    const success = await addThreadToSelectedSlackChannel(
      context,
      slackBotCredentials,
      slackChannelID,
      sharerUser,
      threadID,
      'support',
    );

    return success;
  } catch (e) {
    context.logger.logException(
      'shareThreadToApplicationSupportSlackChannel:',
      e,
      {
        applicationID: application.id,
        applicationSupportOrg: application.supportOrgID,
        userID,
        orgID,
      },
    );
    return false;
  }
}
