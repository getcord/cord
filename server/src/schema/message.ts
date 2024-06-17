import { getReferencedUserIDs } from 'common/util/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import { getSlackMessageURL } from 'server/src/slack/util.ts';

export const messageResolver: Resolvers['Message'] = {
  attachments: async (message, _, context) => {
    if (message.isDeleted()) {
      return [];
    }

    return await context.loaders.messageAttachmentLoader.loadAttachmentsForMessage(
      message.id,
    );
  },
  thread: async (message, _, context) => {
    const thread = await context.loaders.threadLoader.loadThread(
      message.threadID,
    );
    if (!thread) {
      throw new Error('Message refers to non-existent thread');
    }
    return thread;
  },
  content: (message) => (!message.isDeleted() ? message.content : null),
  source: async (message, _, context) => {
    // The author of the message might not exist in the viewer's org. This can
    // happen when the message was written as a reply from Slack to a message
    // shared from platform application such as Typeform
    const user = await context.loaders.userLoader.loadUser(message.sourceID);

    if (user === null) {
      throw `Failed to find source for message id ${message.id} and sourceID ${message.sourceID}`;
    }
    return user;
  },

  reactions: (message, _, context) =>
    !message.isDeleted()
      ? context.loaders.messageReactionLoader.loadReactionsForMessageNoOrgCheck(
          message.id,
        )
      : [],
  seen: async (message, _, context) => {
    const userID = context.session.viewer.userID;
    if (!userID) {
      return false;
    }

    if (message.sourceID === userID) {
      return true;
    }

    const participant =
      await context.loaders.threadParticipantLoader.loadForUserNoOrgCheck({
        threadID: message.threadID,
        userID,
      });

    if (!participant?.lastSeenTimestamp) {
      return false;
    }

    return participant.lastSeenTimestamp >= message.timestamp;
  },
  importedFromSlackChannel: async (message, _, context) => {
    if (message.isDeleted()) {
      return null;
    }
    if (message.importedSlackChannelID === null) {
      return null;
    }

    const slackChannel =
      await context.loaders.slackChannelLoader.loadSlackChannel(
        message.importedSlackChannelID,
      );

    if (slackChannel) {
      return slackChannel.name;
    } else {
      return '';
    }
  },
  referencedUserData: async (message, _, context) => {
    if (message.isDeleted()) {
      return [];
    }
    return await context.loaders.userLoader.loadReferencedUserData(
      context,
      getReferencedUserIDs(message.content),
    );
  },
  task: async (message, _, context) =>
    await context.loaders.taskLoader.loadTaskForMessageNoOrgCheck(message.id),

  slackURL: async (message, _, context) => {
    const {
      importedSlackChannelID: channelID,
      importedSlackMessageTS: ts,
      importedSlackMessageThreadTS: threadTS, // Only replies/in thread messages, have thread_ts
    } = message;

    if (!channelID || !ts) {
      return null;
    }

    if (channelID.startsWith('D')) {
      // Checks if the channel is a direct message channel with a user.
      // See: https://api.slack.com/types/im
      // Currently, you can receive a direct message from the Cord App when you are mentioned

      const userID = assertViewerHasUser(context.session.viewer);
      if (message.sourceID !== userID) {
        // This slackURL link would only work for author of the message
        // As this would be pointing to a direct message with cord app
        return null;
      }
    }

    const org = await context.loaders.orgLoader.loadOrg(message.orgID);
    if (!org || !org.domain) {
      return null;
    }

    return getSlackMessageURL(org.domain, channelID, ts, threadTS);
  },
  isFromEmailReply: (message) => message.replyToEmailNotificationID !== null,
  extraClassnames: (message) => message.extraClassnames,
  metadata: (message) => message.metadata,
  seenBy: async (message, _, context) => {
    const seenByUserIDs =
      await context.loaders.threadParticipantLoader.loadSeenByUsers(message);

    return seenByUserIDs;
  },
};

export const messageSourceTypeResolver: Resolvers['MessageSource'] = {
  // TODO: once we have other source types besides users there will probably
  // need to be some way to distinguish between them
  __resolveType: () => 'User',
};
