import { externalizeID } from 'common/util/externalIDs.ts';
import {
  assertViewerHasOrgs,
  assertViewerHasUser,
  AuthProviderType,
} from 'server/src/auth/index.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { getUsersTyping } from 'server/src/presence/typing.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import type { UserDetails } from 'server/src/util/redirectURI.ts';
import { generateSignedExternalRedirectURI } from 'server/src/util/redirectURI.ts';

export const threadResolver: Resolvers['Thread'] = {
  messages: (thread, args, context) =>
    context.loaders.messageLoader.loadMessages({
      threadID: thread.id,
      cursor: args.cursor ?? undefined,
      range: args.range ?? undefined,
      ignoreDeleted: args.ignoreDeleted ?? undefined,
    }),
  loadMessages: async (thread, args, context) => {
    const messages = await threadResolver.messages(thread, args, context);
    return {
      threadID: thread.id,
      messages,
      ignoreDeleted: !!args.ignoreDeleted,
    };
  },
  participants: async (thread, _args, context) =>
    await context.loaders.threadParticipantLoader.loadForThreadIDNoOrgCheck(
      thread.id,
    ),
  mentioned: async (thread, _args, context) =>
    await context.loaders.messageMentionLoader.loadMentionedUsersForThread(
      thread.id,
    ),
  typingUsers: async (thread, _args, context) => {
    const userIDs = await getUsersTyping(thread.id);
    return await context.loaders.userLoader.loadUsersNoOrgCheck(userIDs);
  },
  newMessagesCount: (thread, _args, context) =>
    context.loaders.threadLoader.loadNewMessageCountNoOrgCheck(thread.id),
  newReactionsCount: (thread, _args, context) =>
    context.loaders.threadLoader.loadNewReactionsCountNoOrgCheck(thread.id),
  firstUnseenMessageID: (thread, _args, context) => {
    return context.loaders.threadLoader.getFirstUnseenMessageIDNoOrgCheck(
      thread.id,
    );
  },
  subscribed: (thread, _args, context) =>
    context.loaders.threadParticipantLoader.loadSubscribedNoOrgCheck(thread.id),
  messagesCountExcludingDeleted: (thread, _args, context) =>
    context.loaders.threadLoader.loadMessagesCountExcludingDeletedNoOrgCheck(
      thread.id,
    ),
  allMessagesCount: (thread, _args, context) =>
    context.loaders.threadLoader.loadMessagesCountNoOrgCheck(thread.id),
  userMessagesCount: (thread, _args, context) =>
    context.loaders.threadLoader.loadUserMessagesCountNoOrgCheck(thread.id),
  actionMessagesCount: (thread, _args, context) =>
    context.loaders.threadLoader.loadActionMessagesCountNoOrgCheck(thread.id),
  replyCount: (thread, _args, context) =>
    context.loaders.threadLoader.loadReplyCount(thread.id),
  initialMessagesInclDeleted: (thread, args, context) =>
    context.loaders.threadLoader.loadInitialMessagesNoOrgCheck(
      thread.id,
      args.initialFetchCount,
    ),
  viewerIsThreadParticipant: (thread, _args, context) =>
    context.loaders.threadParticipantLoader.isViewerThreadParticipantNoOrgCheck(
      thread.id,
    ),
  resolved: (thread, _args, _context) => thread.resolvedTimestamp !== null,
  sharedToSlack: (thread, _args, context) =>
    context.loaders.threadLoader.loadSlackMirroredThreadInfoNoOrgCheck(
      thread.id,
    ),
  loadNewestMessagesToTarget: async (thread, args, context) => {
    const messages = await context.loaders.messageLoader.loadNewestUntilTarget({
      threadID: thread.id,
      targetMessage: args.targetMessage,
    });
    return {
      threadID: thread.id,
      messages,
      ignoreDeleted: args.ignoreDeleted ?? true,
    };
  },
  replyingUserIDs: async (thread, _args, context) =>
    await context.loaders.threadLoader.loadReplyingUserIDsNoOrgCheck(thread.id),
  actionMessageReplyingUserIDs: async (thread, _args, context) =>
    await context.loaders.threadLoader.loadActionMessageReplyingUserIDsNoOrgCheck(
      thread.id,
    ),
  externalOrgID: async (thread, _args, context) => {
    const org = await context.loaders.orgLoader.loadOrg(thread.orgID);
    return org!.externalID;
  },
  location: async (thread, _args, context) => {
    const threadPageData =
      await context.loaders.pageLoader.loadPrimaryPageForThreadNoOrgCheck(
        thread.id,
      );
    if (!threadPageData) {
      throw new Error('Unable to find thread location');
    }
    return threadPageData.contextData;
  },
  navigationURL: async (thread, _args, context) => {
    const userID = assertViewerHasUser(context.session.viewer);
    const userOrgIDs = assertViewerHasOrgs(context.session.viewer);
    if (userOrgIDs.includes(thread.orgID)) {
      return thread.url;
    }

    if (!context.session.viewer.platformApplicationID) {
      return thread.url;
    }

    const [user, org, primaryPage] = await Promise.all([
      UserEntity.findByPk(userID),
      OrgEntity.findByPk(thread.orgID),
      context.loaders.pageLoader.loadPrimaryPageForThreadNoOrgCheck(thread.id),
    ]);

    if (!user || !org || !primaryPage) {
      throw new Error(
        'Unable to resolve UserEntity, OrgEntity or Primary Page',
      );
    }

    const details: UserDetails = {
      userType: AuthProviderType.PLATFORM,
      userID: user.externalID,
      orgID: org.externalID ?? externalizeID(org.id),
      groupID: org.externalID ?? externalizeID(org.id),
      name: user.name,
      email: user.email,
      profilePictureURL: user.profilePictureURL,
    };

    const threadLocation = primaryPage.contextData;

    return await generateSignedExternalRedirectURI(
      context.session.viewer.platformApplicationID,
      thread.url,
      {
        type: 'inbox',
        url: thread.url,
        location: threadLocation,
        threadID: thread.externalID,
        userDetails: details,
      },
    );
  },
};
