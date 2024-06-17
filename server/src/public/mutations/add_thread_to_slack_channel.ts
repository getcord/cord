import {
  addThreadToSelectedSlackChannel,
  findSlackBotCredentials,
} from 'server/src/slack/util.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import { addCordBotToSlackChannels } from 'server/src/slack/api.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { getRelevantContext } from 'server/src/RequestContext.ts';
import { sendErrors } from 'server/src/public/mutations/util/sendErrors.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';

export const addThreadToSelectedSlackChannelResolver: Resolvers['Mutation']['addThreadToSlackChannel'] =
  sendErrors(async (_, args, originalContext) => {
    const { slackChannelID, threadID, installBot, byExternalID } = args;

    const thread = byExternalID
      ? await originalContext.loaders.threadLoader.loadByExternalID(threadID)
      : await originalContext.loaders.threadLoader.loadThread(threadID);

    if (!thread) {
      throw new ApiCallerError('thread_not_found');
    }

    const org = await originalContext.loaders.orgLoader.loadOrg(thread.orgID);
    if (!org) {
      throw new ApiCallerError('group_not_found');
    }
    const slackOrg = await org.loadLinkedSlackOrg();

    if (!slackOrg) {
      throw new ApiCallerError('group_not_connected_to_slack');
    }

    const context = await getRelevantContext(originalContext, thread.orgID);
    const { viewer } = context.session;
    const userID = assertViewerHasUser(viewer);

    const sharerUser =
      await context.loaders.userLoader.loadUserInAnyViewerOrg(userID);

    if (!sharerUser) {
      throw new ApiCallerError('user_not_found');
    }

    const authData = await findSlackBotCredentials(context);
    if (!authData) {
      throw new ApiCallerError('slack_credentials_not_found');
    }

    const slackChannel =
      await context.loaders.slackChannelLoader.loadSlackChannel(slackChannelID);

    if (!slackChannel) {
      throw new ApiCallerError('slack_channel_not_found', {
        message: `Cannot load slack channel ${slackChannelID}`,
      });
    }

    // We have recently noticed that Slack's `member_left_channel` event is
    // very unreliable: when removing the Cord bot from a channel, we don't
    // get this event, even though we definitely should. This means that when
    // we think our bot is present in a channel (because we got
    // `member_joined_channel` in the past - and that event seems to work
    // reliably), it might not be. In that case the message sharing would fail
    // consistently, and we would never present the user with the UI to add
    // the bot to the channel, because our information is that it already is
    // in there.
    // Workaround: when we think we have the bot in the channel already, send a
    // request to the Slack API to join the channel before posting the
    // message there. This *should* be a no-op. However, if our information
    // is outdated, it means that we re-add the Cord bot to the channel when
    // someone shares a message. Not ideal, because the UI we presented made
    // it look like the channel already has the bot in it (so sharing doesn't
    // come with the side effect of message scraping), but what can we do -
    // it's a Slack bug.

    if (slackChannel.added || installBot) {
      await addCordBotToSlackChannels(context, authData.bot_access_token, [
        slackChannelID,
      ]);
    } else {
      return { success: false, failureDetails: null };
    }

    const success = await addThreadToSelectedSlackChannel(
      context,
      authData,
      slackChannelID,
      sharerUser,
      thread.id,
      'internal',
    );

    return { success, failureDetails: null };
  });
