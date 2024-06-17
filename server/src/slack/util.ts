import * as url from 'url';
import type { KnownBlock } from '@slack/web-api';
import { v4 as uuid } from 'uuid';
import * as jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import env from 'server/src/config/Env.ts';

import type {
  UUID,
  MessageContent,
  ThreadMirrorType,
  FileAttachmentInput,
} from 'common/types/index.ts';
import { MessageAttachmentType } from 'common/types/index.ts';

import type { FileUploadStatus } from 'server/src/schema/resolverTypes.ts';

import {
  Viewer,
  AuthProviderType,
  assertViewerHasIdentity,
  assertViewerHasOrg,
} from 'server/src/auth/index.ts';
import {
  ADMIN_ORIGIN,
  ADMIN_SERVER_HOST,
  APP_ORIGIN,
} from 'common/const/Urls.ts';
import {
  CLACK_APPLICATION_ID,
  CORD_SLACK_TEAM_ID,
  RADICAL_ORG_ID,
  SLACK_ADMIN_LOGIN_APP_CLIENT_ID,
} from 'common/const/Ids.ts';
import {
  userDisplayName,
  loadLinkedSlackUserOrgScoped,
  detailsForDisplay,
} from 'server/src/entity/user/util.ts';
import { validateFileForUpload } from 'common/uploads/index.ts';
import { isInlineDisplayableImage } from '@cord-sdk/react/common/lib/uploads.ts';

import {
  sendChannelMessage,
  sendHelpMessage,
  sendPrivateMessage,
} from 'server/src/slack/api.ts';
import type { SlackBotUserAuthData } from 'server/src/slack/types.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { contextWithSession } from 'server/src/RequestContext.ts';
import { getSignedUploadURL } from 'server/src/files/upload.ts';
import { UserMutator } from 'server/src/entity/user/UserMutator.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type { SlackUser } from 'server/src/slack/api.ts';

import { getSequelize } from 'server/src/entity/sequelize.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import {
  slackMrkdwnFromMessageContent,
  mrkdwnEscapeText,
} from 'server/src/slack/mrkdwn.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import type { FileEntity } from 'server/src/entity/file/FileEntity.ts';
import { SlackMessageEntity } from 'server/src/entity/slack_message/SlackMessageEntity.ts';
import { SlackMessageLoader } from 'server/src/entity/slack_message/SlackMessageLoader.ts';
import { MessageMutator } from 'server/src/entity/message/MessageMutator.ts';
import { FileLoader } from 'server/src/entity/file/FileLoader.ts';
import { FileMutator } from 'server/src/entity/file/FileMutator.ts';
import { structuredMessageFromSlackMessage } from 'server/src/slack/message.ts';
import {
  publishPubSubEvent,
  publishUserIdentityUpdate,
} from 'server/src/pubsub/index.ts';
import type {
  MessageAnnotationAttachmentData,
  MessageFileAttachmentData,
} from 'server/src/entity/message_attachment/MessageAttachmentEntity.ts';
import { MessageAttachmentLoader } from 'server/src/entity/message_attachment/MessageAttachmentLoader.ts';
import { ADMIN_LOGIN_SLACK_REDIRECT_URL } from 'server/src/admin/routes/SlackLoginHandler.ts';
import { SlackMirroredThreadEntity } from 'server/src/entity/slack_mirrored_thread/SlackMirroredThreadEntity.ts';
import { SlackMirroredThreadLoader } from 'server/src/entity/slack_mirrored_thread/SlackMirroredThreadLoader.ts';
import { SlackMessageMutator } from 'server/src/entity/slack_message/SlackMessageMutator.ts';
import { SlackMirroredThreadMutator } from 'server/src/entity/slack_mirrored_thread/SlackMirroredThreadMutator.ts';
import {
  flagsUserFromContext,
  getFeatureFlagValue,
} from 'server/src/featureflags/index.ts';
import type { FlagsUser } from 'server/src/featureflags/index.ts';
import { findSlackUserEmailMatch } from 'server/src/util/findSlackUserEmailMatch.ts';
import { withSlackMirroredThreadLock } from 'server/src/util/locks.ts';
import { ThreadMutator } from 'server/src/entity/thread/ThreadMutator.ts';
import { getBadgedImageURL } from 'server/src/image_processing/badge.ts';
import { getResizedImageURL } from 'server/src/image_processing/resizeOnly.ts';
import { Counter } from 'server/src/logging/prometheus.ts';
import { FeatureFlag } from 'common/const/UserPreferenceKeys.ts';
import { injectDeeplinkQueryParamsV1 } from 'server/src/deep_link_threads/index.ts';
import { generateOutboundNotificationLoggingURL } from 'server/src/notifications/outbound/logging.ts';
import { SlackMirroredSupportThreadEntity } from 'server/src/entity/slack_mirrored_support_thread/SlackMirroredSupportThreadEntity.ts';
import { supportStatusButton } from 'server/src/util/interactiveSupportButton.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { Logger } from 'server/src/logging/Logger.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { executeNewMessageCreationTasks } from 'server/src/message/executeMessageTasks.ts';
import { PageEntity } from 'server/src/entity/page/PageEntity.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';
import { createThreadMessage } from 'server/src/public/routes/platform/messages/CreateThreadMessageHandler.ts';
import { forceExternalizeContent } from 'server/src/public/routes/platform/messages/util.ts';
import { getNewLoaders } from 'server/src/RequestContextLoaders.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';

const addMessageToCorrectCordThreadCounter = Counter({
  name: 'AddMessageToCorrectCordThread',
  help: 'Slack messages added to a cord thread',
  labelNames: ['channelType', 'isReply', 'hasAttachments'],
});

async function findSlackUserID(
  context: RequestContext,
  userID: UUID,
): Promise<string | null> {
  // Find the external slack id, if it's a slack user or a platform user
  // explicitly linked to a slack user.  Because this is for notifications, any
  // linking should also be org-scoped (if it is a platform user linked to multiple
  // Slack users, it will find the slack user from the org which is linked to the
  // current platform org)
  const originalOrLinkedUser =
    await context.loaders.userLoader.loadSlackUserForUserOrgScoped(
      context,
      userID,
    );

  if (originalOrLinkedUser) {
    return originalOrLinkedUser.externalID;
  }

  const orgID = context.session.viewer.orgID;
  if (!orgID) {
    return null;
  }

  // No explicitly linked Slack profile was found... but there may be an email
  // matched profile

  const org = await context.loaders.orgLoader.loadOrg(orgID);
  const user = await context.loaders.userLoader.loadUserInAnyViewerOrg(userID);

  if (!org || !user) {
    return null;
  }

  return (
    (await findSlackUserEmailMatch(context, org, user))?.externalID ?? null
  );
}

// find the Slack bot credentials either in the viewer's org, or in the Slack
// org that might be linked to viewer's org
export interface SlackBotCredentials extends SlackBotUserAuthData {
  org: OrgEntity;
}
export async function findSlackBotCredentials(
  context: RequestContext,
): Promise<SlackBotCredentials | null> {
  const { orgID } = context.session.viewer;
  if (!orgID) {
    // If this is a user without an org, we should never be able to reach this code,
    // but for correctness, this check exists.
    return null;
  }
  const org = await context.loaders.orgLoader.loadOrg(orgID);
  if (!org) {
    throw new Error('Could not find org with ID ' + orgID);
  }

  return await org.getSlackBotCredentials();
}

async function sendSlackNotification({
  context,
  senderUserID,
  senderOrgID,
  slackBotCredentials,
  targetSlackUserID,
  notificationTextBlocks,
  messageBlocks,
  messageID,
}: {
  context: RequestContext;
  senderUserID: UUID;
  senderOrgID: UUID;
  slackBotCredentials: SlackBotCredentials;
  targetSlackUserID: string;
  notificationTextBlocks: string[];
  messageBlocks: KnownBlock[];
  messageID: string;
}) {
  const { username, iconURL } = await getUserAndAttributionForUser(
    context,
    senderUserID,
    senderOrgID,
  );

  const notificationText = notificationTextBlocks
    .filter((text) => !!text)
    .join(' ');

  const result = await sendPrivateMessage(
    slackBotCredentials.bot_access_token,
    targetSlackUserID,
    notificationText,
    messageBlocks,
    username,
    iconURL,
  );

  if (!result) {
    return false;
  }

  const success = await SlackMessageEntity.create({
    slackOrgID: slackBotCredentials.org.id,
    slackChannelID: result.channelID,
    slackMessageTimestamp: result.timestamp,
    messageID,
    sharerOrgID: senderOrgID,
    sharerUserID: senderUserID,
  });

  if (!success) {
    context.logger.warn('Failed call to SlackMessageEntity.create', {
      messageID,
      orgID: senderOrgID,
      userID: senderUserID,
      slackChannelId: result.channelID,
      slackTimestamp: result.timestamp,
    });
  }

  return true;
}

async function sendSlackMentionNotification({
  actionText,
  allImageURLs,
  context,
  messageContent,
  messageID,
  pageName,
  providerName,
  senderName,
  senderOrgID,
  senderUserID,
  targetUserID,
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  url,
  annotationsHighlightedText,
}: {
  context: RequestContext;
  senderUserID: UUID;
  senderOrgID: UUID;
  senderName: string;
  targetUserID: UUID;
  messageID: UUID;
  url: string | null;
  pageName: string | null | undefined;
  providerName: string | undefined;
  messageContent: MessageContent;
  allImageURLs: string[];
  actionText: string;
  annotationsHighlightedText: string[];
}): Promise<boolean> {
  const [senderSlackUserID, targetSlackUserID] = await Promise.all([
    findSlackUserID(context, senderUserID),
    findSlackUserID(context, targetUserID),
  ]);
  if (!targetSlackUserID) {
    return false;
  }

  const slackBotCredentials = await findSlackBotCredentials(context);
  if (!slackBotCredentials) {
    return false;
  }

  const messageAsMrkdwn: string = await slackMrkdwnFromMessageContent(
    messageContent,
    (userID: UUID) => findSlackUserID(context, userID),
  );

  const messageBlocks: KnownBlock[] = [];

  // 1. if the receiving user is active:
  // [Name] mentioned you on [page name](url)
  // > [message]

  // 2. if the receiving user is inactive:
  // [Name] mentioned you in [SaaS tool] [with attachments] using Cord – the way your team collaborates in context.
  // > [message]
  // Don't leave 'em hanging, join the conversation.

  // 3. If a Typeform user mentioned a Slack user and that Slack user has not
  // previously used Cord or has been mentioned, then we attach extra explainer
  // text.

  // See https://api.slack.com/block-kit for documentation

  const userName = senderSlackUserID ? `<@${senderSlackUserID}>` : senderName;

  const headerPrefix = `${userName} ${actionText}`;

  const pageNameTextWithURL = pageName
    ? url
      ? `on <${url}|${mrkdwnEscapeText(pageName)}>`
      : `on ${mrkdwnEscapeText(pageName)}`
    : url
    ? `on <${url}>`
    : '';

  const pageNameText = pageName ? `on ${pageName}` : '';

  const providerText = providerName ? `in ${providerName}:` : '';

  const messageHeaderText = [
    headerPrefix, // [name] mentioned you
    pageNameTextWithURL, // on [channel name](url)
    providerText, // in [tool]
  ]
    .filter((text) => !!text)
    .join(' ');

  messageBlocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: messageHeaderText },
  });

  messageBlocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '> ' + messageAsMrkdwn.replace(/\n/g, '\n> '),
    },
  });

  for (const highlightedText of annotationsHighlightedText) {
    messageBlocks.push({
      type: 'context',
      elements: [
        {
          type: 'plain_text',
          text: `📌 "${highlightedText}"`,
        },
      ],
    });
  }

  for (const allImageURL of allImageURLs) {
    messageBlocks.push({
      type: 'image',
      image_url: allImageURL,
      alt_text: 'Image attached to the message',
    });
  }

  const notificationTextBlocks = [
    headerPrefix, // [name] mentioned you
    pageNameText, // on [channel name]
    providerText, // in [tool]:
    `${messageAsMrkdwn}`, // [message text]
  ];

  return await sendSlackNotification({
    context,
    senderUserID,
    senderOrgID,
    slackBotCredentials,
    targetSlackUserID,
    notificationTextBlocks,
    messageBlocks,
    messageID,
  });
}

export async function sendSlackThreadActionNotification({
  context,
  actionText,
  messageID,
  pageName,
  providerName,
  senderName,
  senderOrgID,
  senderUserID,
  targetUserID,
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  url,
  ...rest
}: {
  context: RequestContext;
  senderUserID: UUID;
  senderOrgID: UUID;
  senderName: string;
  targetUserID: UUID;
  messageID: UUID;
  url: string | null;
  pageName: string | null | undefined;
  providerName: string | undefined;
  actionText: string;
}): Promise<boolean> {
  // Make sure we're using all the props
  const _: Record<string, never> = rest;

  const [senderSlackUserID, targetSlackUserID] = await Promise.all([
    findSlackUserID(context, senderUserID),
    findSlackUserID(context, targetUserID),
  ]);
  if (!targetSlackUserID) {
    return false;
  }

  const slackBotCredentials = await findSlackBotCredentials(context);
  if (!slackBotCredentials) {
    return false;
  }

  const messageBlocks: KnownBlock[] = [];
  const userName = senderSlackUserID ? `<@${senderSlackUserID}>` : senderName;
  const headerPrefix = `${userName} ${actionText}`;

  const threadNameWithURL = pageName
    ? url
      ? `<${url}|${mrkdwnEscapeText(pageName)}>`
      : `${mrkdwnEscapeText(pageName)}`
    : url
    ? ` <${url}>`
    : '';

  const pageNameText = pageName ? `${pageName}` : '';

  const providerText = providerName ? `in ${providerName}:` : '';

  const messageHeaderText = [
    headerPrefix, // [name] resolved thread
    threadNameWithURL, // [thread name](url)
    providerText, // in [tool]
  ]
    .filter((text) => !!text)
    .join(' ');

  messageBlocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: messageHeaderText },
  });

  const notificationTextBlocks = [
    headerPrefix, // [name] resolved thread
    pageNameText, // [threadName]
    providerText, // in [tool]:
  ];

  return await sendSlackNotification({
    context,
    senderUserID,
    senderOrgID,
    slackBotCredentials,
    targetSlackUserID,
    notificationTextBlocks,
    messageBlocks,
    messageID,
  });
}

/**
 * Update or create a Slack user profile.
 *
 */
async function updateOrCreateSlackUserProfile(
  org: OrgEntity,
  slackUser: SlackUser,
) {
  const userMutator = new UserMutator(Viewer.createServiceViewer(), null);

  // Slack profiles come with different subsets of `image_*` fields. Currently
  // the largest we render a profile pic is 56x56 pixels, so choose something
  // not much bigger than that to avoid large file download times
  // In the future we may also wish to store larger ones again
  let profilePictureURL: string | null = null;
  for (const key of [
    'image_192', // best compromise for looking good on retina screens but not being too large
    'image_72',
    'image_512',
    'image_1024',
    'image_original',
    'image_48',
    'image_32',
    'image_24',
  ] as (keyof SlackUser['profile'])[]) {
    const value = slackUser.profile[key];

    if (value) {
      profilePictureURL = value;
      break;
    }
  }

  const [user, updated] = await getSequelize().transaction(async (tx) => {
    return await userMutator.updateOrCreateExternalUserInSlackOrg(
      {
        name: slackUser.real_name,
        screenName: slackUser.profile.display_name,
        email: slackUser.profile.email,
        profilePictureURL,
        externalProvider: AuthProviderType.SLACK,
        externalID: slackUser.id,
      },
      org.id,
      slackUser.deleted, // slack user.deleted - to infer what state should be if it's not set explicitly in orgMemberState
      tx,
    );
  });
  if (user && updated) {
    backgroundPromise(
      publishUserIdentityUpdate({
        userID: user.id,
        platformApplicationID: 'extension',
      }),
    );
  }
  return user;
}

export async function sendMessageToCord(
  text: string,
  slackChannelID?: string,
  clackChannel?: string,
): Promise<void> {
  if (!slackChannelID && !clackChannel) {
    throw new Error(
      'Asked to send a message but gave no destinations, that probably is a bug',
    );
  }
  if (slackChannelID) {
    await sendChannelMessage({
      slackBotCredentials: { bot_access_token: env.SLACK_INTERNAL_BOT_TOKEN },
      channelID: slackChannelID,
      text,
    });
  }
  const clackBaseURL = env.CLACK_SERVER_HOST;
  if (clackChannel && clackBaseURL) {
    const messageContent = await structuredMessageFromSlackMessage(
      { text },
      Viewer.createOrgViewer(RADICAL_ORG_ID),
    );
    await createThreadMessage({
      platformApplicationID: CLACK_APPLICATION_ID,
      id: uuid(),
      threadID: uuid(),
      internalMessageID: uuid(),
      authorID: 'ernest',
      content: forceExternalizeContent(messageContent),
      createThread: {
        groupID: 'clack_all',
        organizationID: 'clack_all',
        location: { channel: clackChannel },
        url: `https://${clackBaseURL}/channel/${clackChannel}`,
        name: `#${clackChannel} - Clack`,
      },
      skipLinkPreviews: true,
    });
  }
}

export async function sendReplyHelpMessage(
  accessToken: string,
  recipientUserID: string,
) {
  const text = `💡 *Tip*: Click "Reply in thread" to respond to Cord messages using Slack.
  Your response will appear on the same page as the Cord conversation.`;

  return await sendHelpMessage(accessToken, recipientUserID, text);
}

export async function sendWelcomeHelpMessage(
  accessToken: string,
  recipientUserID: string,
  slackWorkspaceDomain: string,
  onlyPostIfConversationEmpty = false,
) {
  const text = `Hi <@${recipientUserID}>, you'll be notified here when someone mentions you using Cord.

That way, you can chat, annotate, attach files, and create tasks with your team in any software.

<${APP_ORIGIN}/${slackWorkspaceDomain}|Start collaborating anywhere.>`;

  return await sendHelpMessage(
    accessToken,
    recipientUserID,
    text,
    onlyPostIfConversationEmpty,
  );
}

export async function addMessageToSelectedSlackChannel(
  context: RequestContext,
  slackBotCredentials: SlackBotCredentials,
  channelID: string,
  originalSharerUser: UserEntity,
  message: MessageEntity,
  thread: ThreadEntity,
  mirrorType: ThreadMirrorType,
  originalMessageThreadTS?: string,
) {
  const viewer: Viewer = context.session.viewer;
  const blocks: KnownBlock[] = [];

  let org: OrgEntity | null = null;

  if (mirrorType === 'support' && !originalMessageThreadTS) {
    org = await context.loaders.orgLoader.loadOrg(message.orgID);
  }

  // Usually we present a 'unified profile', displaying the latest updated name/pic,
  // whether that's from a linked Slack account (in any org), platform API update, or user
  // Settings update.  However, when sharing to Slack it makes sense to use
  // the Slack profile, and the one tht is from the Slack workspace linked to this Cord org
  // so we can @mention properly
  const sharerSlackUser = await loadLinkedSlackUserOrgScoped(
    originalSharerUser,
    context,
    message.orgID,
  );

  const sharerIsAuthor =
    message.sourceID === sharerSlackUser?.id ||
    message.sourceID === originalSharerUser.id;

  const isScrapedSlackMessage = !!message.importedSlackMessageType;

  const {
    originalUser: authorOriginalUser,
    slackLinkedUser: authorSlackLinkedUser,
    username,
    iconURL,
  } = await getUserAndAttributionForUser(
    context,
    message.sourceID,
    message.orgID,
    isScrapedSlackMessage,
    mirrorType,
  );

  if (!authorOriginalUser) {
    return false;
  }

  const authorOriginalProfileDetailsForDisplay = await detailsForDisplay(
    authorOriginalUser,
    context,
  );

  // A helper fn used for turning @ mentions into proper Slack mentions - doesn't
  // work if sharing to a support bot's workspace because the mentioned user (probably)
  // isn't a member of that workspace so Slack will show the mention as a weird
  // redacted rectangle.  Returning null here means our code will process the name
  // as plain text instead
  const findSlackUserIDHelper =
    mirrorType === 'support'
      ? async () => null
      : (userID: UUID) => findSlackUserID(context, userID);

  const content = await slackMrkdwnFromMessageContent(
    message.content,
    findSlackUserIDHelper,
  );
  const addQueryParamsToSharedToSlack =
    message.url !== null &&
    (await getFeatureFlagValue(
      FeatureFlag.QUERY_PARAM_DEEP_LINKS_IN_SHARE_TO_SLACK,
      flagsUserFromContext(context),
    ));

  let messageUrl: string | null;

  // the check message.url !== null is to satisfy the typechecker
  if (message.url !== null && addQueryParamsToSharedToSlack) {
    messageUrl = injectDeeplinkQueryParamsV1(
      context.logger,
      message.url,
      thread.id,
      message.id,
    );
  } else {
    messageUrl = message.url;
  }

  if (messageUrl !== null) {
    const { userID: sharerUserID, orgID: sharerOrgID } =
      assertViewerHasIdentity(context.session.viewer);

    messageUrl = await generateOutboundNotificationLoggingURL({
      messageID: message.id,
      url: messageUrl,
      targetOrgID: message.orgID,
      targetUserID: null,
      type: 'sharedToSlackChannel',
      platformApplicationID: context.session.viewer.platformApplicationID,
      metadata: {
        type: 'sharedToSlackChannel',
        targetSlackChannelID: channelID,
      },
      sharerUserID,
      sharerOrgID,
    });
  }

  let text = '';
  const authorName =
    // A support-mirrored message goes to another Slack workspace so not helpful
    // to do a profile mention
    mirrorType === 'support'
      ? authorOriginalProfileDetailsForDisplay.displayName
      : await userMention(authorSlackLinkedUser ?? authorOriginalUser, context);

  // If this was a user_message, include the header that says "So and so
  // (replied|shared)".  For an action_message, we skip that and just include
  // the body.
  if (message.type === 'user_message') {
    if (originalMessageThreadTS) {
      text = `${authorName} replied: `;
    } else {
      const mrkdownLink =
        messageUrl === null
          ? thread.name
          : `<${messageUrl}${
              thread.name ? `|${mrkdwnEscapeText(thread.name)}` : ''
            }>`;
      if (mirrorType === 'support') {
        text = `${
          (await detailsForDisplay(originalSharerUser, context)).displayName
        } from ${org?.name} (orgID: ${org?.externalID}) opened a support request in a thread${
          mrkdownLink ? ' in ' + mrkdownLink : ''
        }`;
      } else {
        text = `${await userMention(
          sharerSlackUser ?? originalSharerUser,
          context,
        )} shared ${
          sharerIsAuthor ? 'their message' : `this message from ${authorName}`
        }${mrkdownLink ? ' in ' + mrkdownLink : ''}`;
      }
    }
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text } });
  }

  // Present the body of the message like a blockquote (prefix every line with
  // '> ')
  blocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: '> ' + content.replace(/\n/g, '\n> ') },
  });

  const messageAttachmentLoader = new MessageAttachmentLoader(viewer);
  const fileLoader = new FileLoader(viewer);

  const attachedFiles: FileEntity[] = await messageAttachmentLoader
    .loadAttachmentsForMessage(message.id)
    .then((attachments) => {
      const fileIDs: UUID[] = [];

      for (const attachment of attachments) {
        if (!('type' in attachment)) {
          break;
        }

        switch (attachment.type) {
          case MessageAttachmentType.FILE: {
            const { fileID } = attachment.data as MessageFileAttachmentData;
            fileIDs.push(fileID);
            break;
          }
          case MessageAttachmentType.ANNOTATION: {
            const { screenshotFileID, blurredScreenshotFileID } =
              attachment.data as MessageAnnotationAttachmentData;
            if (blurredScreenshotFileID) {
              fileIDs.push(blurredScreenshotFileID);
            } else if (screenshotFileID) {
              fileIDs.push(screenshotFileID);
            }
            break;
          }
        }
      }
      return fileLoader.loadFiles(fileIDs);
    });

  for (const fileEntity of attachedFiles) {
    if (
      fileEntity.uploadStatus === 'uploaded' &&
      isInlineDisplayableImage(fileEntity.mimeType)
    ) {
      blocks.push({
        type: 'image',
        image_url: fileEntity.getPermanentDownloadURL(),
        alt_text: 'attached image',
      });
    }
  }
  if (mirrorType === 'support' && !originalMessageThreadTS) {
    // add close/reopen button to top message only
    blocks.push(
      {
        type: 'divider',
      },
      supportStatusButton('close', thread.id),
    );
  }

  const result = await sendChannelMessage({
    slackBotCredentials,
    channelID,
    text,
    blocks,
    threadTS: originalMessageThreadTS,
    username,
    iconURL,
  });

  if (!result) {
    return false;
  }

  const success = await SlackMessageEntity.create({
    slackOrgID: slackBotCredentials.org.id,
    slackChannelID: result.channelID,
    slackMessageTimestamp: result.timestamp,
    messageID: message.id,
    sharerOrgID: message.orgID,
    sharerUserID: originalSharerUser.id,
  });

  if (!success) {
    context.logger.warn('Failed call to SlackMessageEntity.create', {
      messageID: message.id,
      sharerOrgID: message.orgID,
      sharerUserID: originalSharerUser.id,
      slackChannelID: result.channelID,
      slackMessageTimestamp: result.timestamp,
    });
  }

  return result;
}

export function addThreadToSelectedSlackChannel(
  context: RequestContext,
  slackBotCredentials: SlackBotCredentials,
  channelID: string,
  sharerUser: UserEntity,
  threadID: UUID,
  mirrorType: ThreadMirrorType,
) {
  return withSlackMirroredThreadLock(
    threadID,
    mirrorType,
  )(async () => {
    const thread = await context.loaders.threadLoader.loadThread(threadID);

    if (
      mirrorType === 'internal' &&
      (await context.loaders.slackMirroredThreadLoader.threadIsMirrored(
        threadID,
      ))
    ) {
      // Sorry, no can do. This thread is already being mirrored to Slack.
      throw new ApiCallerError('thread_already_shared');
    } else if (
      mirrorType === 'support' &&
      (await SlackMirroredSupportThreadEntity.findByPk(threadID))
    ) {
      // TODO: Set thread.supportStatus to open if it is closed
      // from future interactive slack buttons
      return false;
    }

    if (!thread) {
      context.logger.warn('Failed to load thread', {
        threadID: threadID,
        slackChannelID: channelID,
        sharerUserID: sharerUser.id,
      });
      return false;
    }

    const messagesInThread = await context.loaders.messageLoader.loadMessages({
      threadID,
      ignoreDeleted: true,
    });

    if (messagesInThread.length === 0) {
      context.logger.warn('Failed to load any messages in thread', {
        threadID: threadID,
        slackChannelID: channelID,
        sharerUserID: sharerUser.id,
      });
      return false;
    }

    const [firstThreadMessage, ...inThreadMessages] = messagesInThread;

    const originalSlackMessage = await addMessageToSelectedSlackChannel(
      context,
      slackBotCredentials,
      channelID,
      sharerUser,
      firstThreadMessage,
      thread,
      mirrorType,
    );

    if (!originalSlackMessage) {
      context.logger.error(
        'Failed to call addMessageToSelectedSlackChannel for first message in thread',
        {
          threadID: threadID,
          messageID: firstThreadMessage.id,
          slackChannelID: channelID,
          sharerUserID: sharerUser.id,
          orgID: firstThreadMessage.orgID,
        },
      );
      return false;
    }

    for (const message of inThreadMessages) {
      const sentMessage = await addMessageToSelectedSlackChannel(
        context,
        slackBotCredentials,
        channelID,
        sharerUser,
        message,
        thread,
        mirrorType,
        originalSlackMessage.timestamp,
      );

      if (!sentMessage) {
        context.logger.error(
          'Failed call to addMessageToSelectedSlackChannel for a message in thread',
          {
            threadID: threadID,
            messageID: message.id,
            slackChannelID: channelID,
            sharerUserID: sharerUser.id,
            orgID: message.orgID,
          },
        );
      }
    }

    if (mirrorType === 'internal') {
      await SlackMirroredThreadEntity.create({
        threadID,
        threadOrgID: thread.orgID,
        slackOrgID: slackBotCredentials.org.id,
        slackChannelID: originalSlackMessage.channelID,
        slackMessageTimestamp: originalSlackMessage.timestamp,
      });
    } else if (mirrorType === 'support') {
      await getSequelize().transaction(async (transaction) => {
        await SlackMirroredSupportThreadEntity.create(
          {
            threadID,
            threadOrgID: thread.orgID,
            slackOrgID: slackBotCredentials.org.id,
            slackChannelID: originalSlackMessage.channelID,
            slackMessageTimestamp: originalSlackMessage.timestamp,
          },
          { transaction },
        );

        const threadMutator = new ThreadMutator(
          context.session.viewer,
          context.loaders,
        );
        await threadMutator.setThreadSupportStatus(
          threadID,
          'open',
          transaction,
        );
      });
    }

    await publishPubSubEvent(
      'thread-share-to-slack',
      { threadID },
      {
        info: await context.loaders.threadLoader.loadSlackMirroredThreadInfoNoOrgCheck(
          threadID,
        ),
      },
    );

    return true;
  });
}

export async function addMessageToCorrectCordThread(
  logger: Logger,
  accessToken: string,
  event: any,
  viewerFromSlack: Viewer,
) {
  const { channel, ts, thread_ts, text, files } = event;
  // event.channel is the channelID i.e C01NWD8JBR8
  // event.ts is the message timestamp i.e. 1614616185.003000
  // event.text is the plain text message content, will need to add formatting later
  // event.files is an array of attachments, with all its information
  // If this message is a reply to an earlier message, event.thread_ts is the
  // message timestamp of that message.

  const { userID: userIDFromSlack } = assertViewerHasIdentity(viewerFromSlack);

  const slackMirroredThreadLoader = new SlackMirroredThreadLoader(
    viewerFromSlack,
  );
  const slackMirroredThread = await slackMirroredThreadLoader.loadFromSlackID(
    channel,
    thread_ts,
  );

  const orgID = assertViewerHasOrg(viewerFromSlack);

  const slackMirroredSupportThread =
    await SlackMirroredSupportThreadEntity.findOne({
      where: {
        slackChannelID: channel,
        slackMessageTimestamp: thread_ts,
        [Op.or]: { slackOrgID: orgID, threadOrgID: orgID },
      },
    });

  let threadID: UUID;
  let threadViewer: Viewer;
  let context: RequestContext;
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  let url: string | null = null;

  if (slackMirroredThread) {
    // This message is a reply to a Slack thread that was created by sharing a
    // Cord thread to Slack.

    threadID = slackMirroredThread.threadID;
    threadViewer = Viewer.createLoggedInViewer(
      userIDFromSlack,
      slackMirroredThread.threadOrgID,
    );
    context = await contextWithSession(
      { viewer: threadViewer },
      getSequelize(),
      null,
      null,
    );
  } else if (slackMirroredSupportThread) {
    threadID = slackMirroredSupportThread.threadID;

    const application = await ApplicationEntity.findOne({
      where: {
        supportOrgID: slackMirroredSupportThread.slackOrgID,
        supportSlackChannelID: slackMirroredSupportThread.slackChannelID,
      },
    });

    if (!application) {
      logger.debug(
        'No application found with mirrored support thread details.',
      );
      return;
    }

    if (!application.supportBotID) {
      logger.debug(
        'Application matched with mirrored support thread details does not contain a support bot ID.',
      );
      return;
    }

    const [user, org] = await Promise.all([
      UserEntity.findByPk(application.supportBotID),
      OrgEntity.findOne({
        where: { id: slackMirroredSupportThread.threadOrgID },
      }),
    ]);

    if (!user || !org) {
      // We should not get here, as the support bot ID is created by us. So the user and org
      // of this flow should always be present. But just in case...
      logger.error(
        'Could not match the relevant user and organization for the support bot.',
      );
      return;
    }

    threadViewer = await Viewer.createLoggedInPlatformViewer({
      user,
      org,
    });
    context = await contextWithSession(
      { viewer: threadViewer },
      getSequelize(),
      null,
      null,
    );
  } else {
    // If the Slack thread is not mirrored in Cord, this message might still be a
    // reply to a single message that was shared from Cord to Slack.
    // Using event.ts and event.channel, check whether the message reply is a
    // reply to a shared message from cord by checking wether the origin

    const slackMessageLoader = new SlackMessageLoader(viewerFromSlack);
    const slackMessage = await slackMessageLoader.loadSlackMessage(
      channel,
      thread_ts,
    );

    if (slackMessage === null) {
      // The message isn't a reply to a message shared from cord
      return;
    }

    // the original message might not belong to the viewer's (Slack) org, but to
    // the (platform) org which shared this message to Slack by linking their
    // org to Slack. In that case `orgIDFromSlack` is the orgID of the Slack
    // org, and `slackMessage.sharerOrgID` is the orgID of the platform org. The
    // Cord thread belongs to the platform org.
    // If the thread belongs to a regular Slack org, `orgIDFromSlack` is equal
    // to `slackMessage.sharerOrgID`.
    // Either way, we can construct a viewer that can access the thread using
    // `slackMessage.sharerOrgID`.
    threadViewer = Viewer.createLoggedInViewer(
      userIDFromSlack,
      slackMessage.sharerOrgID,
    );
    context = await contextWithSession(
      { viewer: threadViewer },
      getSequelize(),
      null,
      null,
    );

    const originalMessage = await context.loaders.messageLoader.loadMessage(
      slackMessage.messageID,
    );

    if (originalMessage === null) {
      return;
    }

    threadID = originalMessage.threadID;
    url = originalMessage.url;
  }

  // The viewer will have been mutated by now,
  // so we want to have the updated information
  // in the logger
  logger = logger.childLogger(threadViewer);

  addMessageToCorrectCordThreadCounter.inc({
    channelType: event.channel_type,
    isReply: event.thread_ts ? 'true' : 'false',
    hasAttachments: files ? files.length : 'false',
  });

  const structuredMessage = await structuredMessageFromSlackMessage(
    { text },
    viewerFromSlack,
  );

  const giphyFileID = await uploadGiphy(logger, event, viewerFromSlack);

  const timestamp = new Date(Number(ts) * 1000);

  const messageMutator = new MessageMutator(threadViewer, context.loaders);

  const thread = await ThreadEntity.findByPk(threadID);

  if (!thread) {
    logger.debug('No thread found for this slack message.', {
      event,
    });
    return;
  }

  const message = await messageMutator.createMessage({
    content: giphyFileID ? [] : structuredMessage,
    thread,
    id: uuid(),
    url,
    timestamp,
    importedSlackChannelID: channel,
    importedSlackMessageTS: ts,
    importedSlackMessageType: slackMirroredSupportThread
      ? 'supportBotReply'
      : 'reply',
    importedSlackMessageThreadTS: thread_ts || null,
  });

  let fileAttachments: FileAttachmentInput[] = [];
  if (files && files.length) {
    fileAttachments = await uploadMessageAttachments(
      logger,
      accessToken,
      threadViewer,
      files,
    );
  }
  if (giphyFileID) {
    fileAttachments.push({
      id: uuid(),
      fileID: giphyFileID,
    });
  }

  const application = await ApplicationEntity.findByPk(
    thread.platformApplicationID,
  );
  if (!application) {
    throw new Error(`Could not find application for thread ${thread.id}`);
  }
  const page = await PageEntity.findOne({
    where: {
      contextHash: thread.pageContextHash,
    },
  });
  if (!page) {
    throw new Error(
      `Could not find page for message ${message.id} and thread ${thread.id}`,
    );
  }

  const flagsUser: FlagsUser = {
    userID: threadViewer.userID || '',
    orgID: threadViewer.orgID,
    platformApplicationID: application?.id || '',
    version: context.clientVersion,
    customerID: application?.customerID || '',
  };

  await executeNewMessageCreationTasks({
    context,
    flagsUser,
    application,
    page,
    thread,
    message,
    fileAttachments,
    annotationAttachments: [],
    isFirstMessage: false,
    task: null,
    screenshotAttachment: null,
    // We only want to forward notifications to thread participants
    // when the reply is coming from a support bot
    sendNotifications: !!slackMirroredSupportThread,
    subscribeToThread: false,
  });
}

async function userMention(user: UserEntity, context: RequestContext) {
  const { displayName } = await detailsForDisplay(user, context);

  return user.externalProvider === AuthProviderType.SLACK && user.externalID
    ? `<https://app.slack.com/team/${user.externalID}|${displayName}>`
    : displayName;
}

async function uploadMessageAttachments(
  logger: Logger,
  accessToken: string,
  viewer: Viewer,
  files: any, // the slack api event.files object
): Promise<FileAttachmentInput[]> {
  // Get the relevant data from event.file
  // and store it in an array of objects with type fileAttachments
  type FileAttachment = {
    id: string;
    name: string;
    mimetype: string;
    size: number;
    slackURL: string;
  };

  let fileAttachments: FileAttachment[] = [];

  logger.debug(`uploadMessageAttachments`, { files });

  if (Array.isArray(files)) {
    fileAttachments = files
      .map(({ name, mimetype, size, url_private }) => ({
        id: uuid(),
        name,
        mimetype,
        size,
        slackURL: url_private,
      }))
      .filter(
        (x): x is FileAttachment =>
          typeof x.name === 'string' &&
          typeof x.mimetype === 'string' &&
          typeof x.size === 'number' &&
          validateFileForUpload('attachment', {
            name: x.name,
            mimeType: x.mimetype,
            size: x.size,
          }).valid &&
          typeof x.slackURL === 'string',
      );
  }

  logger.debug(
    `addMessageAttachmentToCordMessage: attaching ${fileAttachments.length} of ${files.length} attachments`,
  );

  // uploadedAndFailedAttachments is an array of FileAttachment or null
  // where the null values are from attachments that failed to upload to our s3 bucket
  const uploadedAndFailedAttachments = await Promise.all(
    fileAttachments.map(async (attachment) => {
      // for each fileAttachments
      // check the attachment has the right mimetype and size
      // fetch the attachment from slack using the url_private url and the bot accessToken
      // requires file:read scope from slack api

      const slackFileResponse = await fetch(attachment.slackURL, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // At this point we have received only the response status and headers from Slack.
      // If the status is okay (200), `slackFileResponse.body` will be a stream from which we
      // can read the file contents. We pass that stream to the `fetch` call below.
      // As a result, we do not download the whole file before we start the upload,
      // but we stream the file contents directly from Slack's response into our PUT request to S3.

      if (slackFileResponse.status !== 200) {
        logger.error(
          `Attachment download failed with status ${slackFileResponse.status}`,
          { attachment },
        );
        return null;
      }

      await uploadToS3AndCreateFileEntity({
        logger,
        fileID: attachment.id,
        fileName: attachment.name,
        size: attachment.size,
        mimetype: attachment.mimetype,
        file: slackFileResponse.body!,
        viewer,
      });
      return attachment;
    }),
  );

  //To filter out failed uploads
  const uploadedAttachments = uploadedAndFailedAttachments.filter(
    (attachment): attachment is FileAttachment => !!attachment,
  );

  // Return the uploaded attachments so that they can be set as message
  // attachments later in the logic.
  return uploadedAttachments.map(({ id }) => ({ id: uuid(), fileID: id }));
}

export const allowImportUser = (member: SlackUser) =>
  member.id !== 'USLACKBOT' && !member.is_bot;

export { sendSlackMentionNotification, updateOrCreateSlackUserProfile };

export function slackAdminLoginURL(nonce: string, redirectPath: string) {
  return url.format({
    protocol: 'https',
    host: 'slack.com',
    pathname: '/openid/connect/authorize',
    query: {
      response_type: 'code',
      scope: ['openid', 'profile', 'email'].join(','),
      client_id: SLACK_ADMIN_LOGIN_APP_CLIENT_ID,
      state: jwt.sign(
        {
          host: ADMIN_SERVER_HOST,
          redirect_to: new URL(redirectPath, ADMIN_ORIGIN).href,
        },
        env.OAUTH_STATE_SIGNING_SECRET,
        {
          expiresIn: '1 min',
          algorithm: 'HS512',
        },
      ),
      team: CORD_SLACK_TEAM_ID,
      nonce,
      redirect_uri: ADMIN_LOGIN_SLACK_REDIRECT_URL,
    },
  });
}

async function getUserAndAttributionForUser(
  context: RequestContext,
  userID: string,
  orgID: string,
  isScrapedSlackMessage = false,
  mirrorType?: string,
) {
  const originalUser =
    await context.loaders.userLoader.loadUserInAnyViewerOrg(userID);

  if (!originalUser) {
    context.logger.error('Cant find profile for user');
    return {};
  }

  // Usually the 'unified profile' prefers the latest updated name/pic, but when
  // sharing to Slack it makes sense to prefer the profile linked to that Slack
  // org, so we can @mention properly
  const slackLinkedUser = await loadLinkedSlackUserOrgScoped(
    originalUser,
    context,
    orgID,
  );

  const originalProfileDisplayDetails = await detailsForDisplay(
    originalUser,
    context,
  );

  let username: string | undefined;
  let iconURL: string | undefined;

  if (
    await getFeatureFlagValue('impersonate_slack_message_author', {
      userID,
      orgID,
      platformApplicationID:
        context.session.viewer.platformApplicationID ?? 'extension',
      version: context.clientVersion,
      customerID: context.application?.customerID,
    })
  ) {
    // If it's a support message it will be going to another Slack workspace and it doesn't
    // make sense to prefer the user's Slack profile over the 'normal' unified profile
    username =
      mirrorType === 'support'
        ? originalProfileDisplayDetails.displayName
        : slackLinkedUser
        ? userDisplayName(slackLinkedUser)
        : originalProfileDisplayDetails.displayName;
    let badgeLogoURL: string | null = null;

    if (
      originalUser.externalProvider === AuthProviderType.PLATFORM &&
      originalUser.platformApplicationID
    ) {
      const application = await context.loaders.applicationLoader.load(
        originalUser.platformApplicationID,
      );

      if (application) {
        username = `${username} (on ${application.name})`;
        badgeLogoURL = application.iconURL;
      }
      // If the message originated from Slack in the first place, don't add '(via Cord)'
    } else if (!isScrapedSlackMessage) {
      // If it is a scraped slack message, we will use an unbadged picture
      // so it looks like a normal Slack profile
      username = `${username} (via Cord)`;
      badgeLogoURL = `${APP_ORIGIN}/static/provider-icons/cord.png`;
    }

    iconURL =
      mirrorType === 'support'
        ? originalProfileDisplayDetails.profilePictureURL ?? undefined
        : slackLinkedUser?.profilePictureURL ??
          originalProfileDisplayDetails.profilePictureURL ??
          undefined;

    if (
      iconURL &&
      (badgeLogoURL || isScrapedSlackMessage) &&
      (await getFeatureFlagValue('badge_attribution_avatar', {
        userID,
        orgID,
        platformApplicationID:
          context.session.viewer.platformApplicationID ?? 'extension',
        version: context.clientVersion,
      }))
    ) {
      try {
        iconURL = badgeLogoURL
          ? await getBadgedImageURL(iconURL, badgeLogoURL)
          : await getResizedImageURL(iconURL);
      } catch (err) {
        context.logger.logException(
          'getBadgedImageURL or getResizedImageURL',
          err,
          undefined,
          undefined,
          'warn',
        );
      }
    }
  }

  return {
    originalUser,
    slackLinkedUser,
    username,
    iconURL,
  };
}

export function getSlackMessageURL(
  domain: string,
  slackChannelID: string,
  slackMessageTS: string,
  SlackThreadTS: string | null,
) {
  const tsWithoutPeriod = slackMessageTS.replace('.', '');
  let slackURL = `https://${domain}.slack.com/archives/${slackChannelID}/p${tsWithoutPeriod}`;

  if (SlackThreadTS) {
    const threadTsWithoutPeriod = SlackThreadTS.replace('.', '');
    slackURL += `?thread_ts=${threadTsWithoutPeriod}&cid=${slackChannelID}`;
  }

  return slackURL;
}

export async function unlinkThreadOnSlackMessageDelete(
  event: any,
  org: OrgEntity,
) {
  if (
    event.subtype === 'message_deleted' ||
    (event.subtype === 'message_changed' &&
      event.message &&
      event.message.subtype === 'tombstone')
  ) {
    // A message was deleted or tombstoned. (A message is tombstoned if it is
    // the top message of a Slack in thread with existing replies.)
    const { channel } = event;
    const timestamp = event.deleted_ts ?? event.message?.ts;

    if (typeof channel === 'string' && typeof timestamp === 'string') {
      const viewer = Viewer.createOrgViewer(org.id);

      // If this message was shared from Cord, it is listed in the
      // slack_messages table. If so, remove the corresponding entry in that
      // table.
      const slackMessageMutator = new SlackMessageMutator(viewer);
      await slackMessageMutator.unlinkSlackMessage(channel, timestamp);

      // If the deleted/tombstoned message was the top message of a Slack thread
      // that was shared from Cord, unlink!
      const slackMirroredThreadMutator = new SlackMirroredThreadMutator(viewer);
      const linkedThreadInfo =
        await slackMirroredThreadMutator.unlinkSlackThread(channel, timestamp);

      if (linkedThreadInfo) {
        // There actually was a linked Cord thread.
        const { threadID, threadOrgID } = linkedThreadInfo;

        const orgViewer = Viewer.createOrgViewer(threadOrgID);
        const orgLoaders = await getNewLoaders(orgViewer);
        const messageMutator = new MessageMutator(
          Viewer.createOrgViewer(threadOrgID),
          orgLoaders,
        );
        await messageMutator.resetSlackImportForThread(threadID);

        if (event.subtype === 'message_changed') {
          // The top-level Slack message was not fully deleted, but replaced with
          // a tombstone.
          const slackBotCredentials = await org.getSlackBotCredentials();
          if (slackBotCredentials) {
            await sendChannelMessage({
              slackBotCredentials,
              channelID: channel,
              text: 'This message thread is no longer shared with Cord, because the top message has been deleted in Slack.',
              threadTS: timestamp,
            });
          }
        }

        // Notify clients this thread is no longer shared to Slack
        await publishPubSubEvent(
          'thread-share-to-slack',
          { threadID },
          { info: null },
        );
      }
    }
    return;
  }
}

async function uploadToS3AndCreateFileEntity({
  logger,
  fileID,
  fileName,
  size,
  mimetype,
  file,
  viewer,
}: {
  logger: Logger;
  fileID: string | UUID;
  fileName: string;
  size: number;
  mimetype: string;
  file: ReadableStream<Uint8Array>;
  viewer: Viewer;
}) {
  const uploadURL = getSignedUploadURL(fileID, size, mimetype);

  let fileUploadStatus: FileUploadStatus = 'uploading';

  const uploadResponse = await fetch(uploadURL, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Length': `${size}`,
      'Content-Type': mimetype,
    },
  });

  if (uploadResponse.status !== 200) {
    logger.error(
      `Slack attachment upload failed with status ${uploadResponse.status}`,
      {
        fileID,
        fileName,
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
      },
    );
    return null;
  }

  fileUploadStatus = 'uploaded';

  // Create file entity for the attachment
  const loaders = await getNewLoaders(viewer);
  const fileMutator = new FileMutator(viewer, loaders);

  await fileMutator.createFileForUpload(
    fileID,
    fileName,
    mimetype,
    size,
    fileUploadStatus,
  );

  return fileID;
}

async function uploadGiphy(logger: Logger, msg: any, viewer: Viewer) {
  // Check if this is a message from the giphy bot and if so, if it is in the expected format
  if (msg.bot_profile?.name !== 'giphy' || !msg.blocks?.[0]?.image_url) {
    return null;
  }
  const giphyURL = msg.blocks[0].image_url;
  const image = await fetch(giphyURL);

  if (image.status !== 200) {
    logger.error(
      `Giphy attachment download failed with status ${image.status}`,
      { url: msg.blocks?.[0]?.image_url },
    );
    return null;
  }

  const contentLength = image.headers.get('Content-Length');
  const contentType = image.headers.get('Content-Type');

  if (!contentLength || !contentType) {
    logger.error(
      `Couldn't find necessary headers in order to upload giphy image`,
      { url: msg.blocks?.[0]?.image_url, contentLength, contentType },
    );
    return null;
  }

  const fileID = uuid();

  const result = await uploadToS3AndCreateFileEntity({
    logger,
    fileID,
    fileName: `giphy_${msg.blocks[0].title?.text}`,
    size: Number(contentLength),
    mimetype: contentType,
    file: image.body!,
    viewer,
  });

  if (!result) {
    return null;
  }

  return fileID;
}
