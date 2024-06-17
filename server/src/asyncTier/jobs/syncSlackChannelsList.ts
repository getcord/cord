import * as Slack from '@slack/web-api';
import bluebird from 'bluebird';
import { fetchSlackChannelList } from 'server/src/slack/api.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { OrgLoader } from 'server/src/entity/org/OrgLoader.ts';
import { SlackChannelMutator } from 'server/src/entity/slack_channel/SlackChannelMutator.ts';
import { Viewer } from 'server/src/auth/index.ts';
import type { Logger } from 'server/src/logging/Logger.ts';
import { AsyncTierJobDefinition } from 'server/src/asyncTier/jobDefinition.ts';
import type { EmptyJsonObject } from 'common/types/index.ts';

export default new AsyncTierJobDefinition(
  'syncSlackChannelsList',
  syncSlackChannelsList,
).schedule({
  tier: 'staging',
  name: 'daily',
  cron: '0 10 * * *',
  data: {},
});

async function syncSlackChannelsList(_: EmptyJsonObject, logger: Logger) {
  logger.info('Starting Slack channel list sync for all active orgs');

  const orgLoader = new OrgLoader(Viewer.createAnonymousViewer());
  const orgs = await orgLoader.loadAllActiveSlackOrgs();

  await bluebird.Promise.map(
    orgs,
    (org) => fetchAndSaveSlackChannels(org, logger),
    {
      concurrency: 10,
    },
  );
}

async function fetchAndSaveSlackChannels(org: OrgEntity, jobLogger: Logger) {
  const viewer = Viewer.createOrgViewer(org.id);
  const logger = jobLogger.childLogger(viewer, {
    id: org.id,
    externalId: org.externalID,
    appId: org.platformApplicationID,
    name: org.name,
  });
  logger.debug("Fetching an org's Slack channels");

  const slackBotCredentials = await org.getSlackBotCredentials();
  if (!slackBotCredentials) {
    logger.warn('fetchAndSaveSlackChannels: no SlackBotCredentials');
    return;
  }
  const { bot_access_token } = slackBotCredentials;

  try {
    const channelList = await fetchSlackChannelList(
      new Slack.WebClient(bot_access_token),
    );

    // save Slack channels in database
    await new SlackChannelMutator(viewer).createMany(channelList);
  } catch (error: any) {
    if (error?.data?.error === 'account_inactive') {
      // the company has removed Cord from Slack. What to do with such
      // companies is still up for discussion, but we don't need to log an
      // error just because a company stopped using Cord.
      logger.warn(
        'Failed to scrape list of Slack channels because company removed Cord from Slack',
        error,
      );

      await org.update({ externalAuthData: null });
    } else {
      logger.logException('Error scraping list of Slack channels', error);
    }
  }
}
