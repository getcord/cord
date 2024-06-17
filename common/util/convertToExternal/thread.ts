import * as base64 from 'js-base64';
import { MessageNodeType } from 'common/types/index.ts';
import type {
  UUID,
  NonNullableKeys,
  MessageContent,
} from 'common/types/index.ts';
import { isDefined } from 'common/util/index.ts';
import {
  externalizeID,
  extractInternalID,
  isExternalizedID,
} from 'common/util/externalIDs.ts';
import { convertStructuredMessageToText } from '@cord-sdk/react/common/lib/messageNode.ts';
import type {
  MessageReactionFragment,
  MessageFragment,
  UserFragment,
  MessageFileAttachmentFragment,
  MessageAnnotationAttachmentFragment,
  MessageScreenshotAttachmentFragment,
  MessageLinkPreviewFragment,
  ThreadFragment,
} from 'common/graphql/types.ts';
import type {
  ClientMessageData,
  ThreadSummary,
  Reaction,
  MessageAttachment,
  CoreThreadData,
} from '@cord-sdk/types';

export type UserByInternalIdFn = (id: UUID) => UserFragment | undefined;

function convertMessageReactionsToMessageDataReactions(
  messageReactions: MessageReactionFragment[],
): Reaction[] {
  return messageReactions.map((reaction) => {
    return {
      reaction: reaction.unicodeReaction,
      userID: reaction.user.externalID,
      timestamp: new Date(reaction.timestamp),
    };
  });
}

export function getMessageData({
  message,
  thread,
  userByInternalID,
}: {
  message: MessageFragment;
  thread: Pick<ThreadFragment, 'externalID' | 'externalOrgID' | 'name'>;
  userByInternalID: UserByInternalIdFn;
}): ClientMessageData {
  const attachments: MessageAttachment[] = message.attachments
    .filter(
      (
        a,
      ): a is
        | NonNullableKeys<MessageFileAttachmentFragment, 'file'>
        | NonNullableKeys<MessageAnnotationAttachmentFragment, 'screenshot'>
        | NonNullableKeys<MessageScreenshotAttachmentFragment, 'screenshot'>
        | MessageLinkPreviewFragment => {
        if (a.__typename === 'MessageFileAttachment') {
          return isDefined(a.file);
        } else if (a.__typename === 'MessageAnnotationAttachment') {
          return true;
        } else if (a.__typename === 'MessageScreenshotAttachment') {
          return isDefined(a.screenshot);
        } else if (a.__typename === 'MessageLinkPreview') {
          return true;
        } else {
          console.error('Unexpected MessageAttachment type');
          return false;
        }
      },
    )
    .map((a) => {
      if (a.__typename === 'MessageFileAttachment') {
        return {
          id: a.file.id,
          type: 'file',
          name: a.file.name,
          url: a.file.url,
          mimeType: a.file.mimeType,
          size: a.file.size,
          uploadStatus: a.file.uploadStatus,
        };
      } else if (a.__typename === 'MessageAnnotationAttachment') {
        return {
          type: 'annotation',
          textContent:
            a.location?.highlightedTextConfig?.textToDisplay ??
            a.customHighlightedTextConfig?.textToDisplay ??
            null,
          locationData: a.location
            ? base64.encode(JSON.stringify(a.location))
            : null,
          customData: a.customLocation
            ? {
                location: a.customLocation,
                coordsRelativeToTarget: a.coordsRelativeToTarget!, // always set when custom locations used
                label: a.customLabel,
              }
            : null,
          screenshot: a.screenshot
            ? {
                id: a.id,
                name: thread.name ?? 'annotation',
                url: a.screenshot.url,
                mimeType: a.screenshot.mimeType,
                size: a.screenshot.size,
                uploadStatus: a.screenshot.uploadStatus,
              }
            : null,
        };
      } else if (a.__typename === 'MessageScreenshotAttachment') {
        return {
          type: 'screenshot',
          screenshot: {
            id: a.id,
            name: thread.name ?? 'screenshotConfig-generated-screenshot',
            url: a.screenshot.url,
            mimeType: a.screenshot.mimeType,
            size: a.screenshot.size,
            uploadStatus: a.screenshot.uploadStatus,
          },
        };
      } else if (a.__typename === 'MessageLinkPreview') {
        return {
          type: 'link_preview',
          id: a.id,
          url: a.url,
          imageURL: a.img,
          title: a.title,
          description: a.description,
        };
      } else {
        // This can never happen because of the previous .filter
        return {} as MessageAttachment;
      }
    });

  return {
    id: message.externalID ?? externalizeID(message.id),
    organizationID: thread.externalOrgID,
    groupID: thread.externalOrgID,
    threadID: thread.externalID,
    authorID: message.source.externalID,
    url: message.url,
    content: message.content
      ? externalizeMessageContent(message.content, userByInternalID)
      : [],
    plaintext: message.content
      ? convertStructuredMessageToText(message.content)
      : '',
    type: message.type,
    iconURL: message.iconURL,
    translationKey: message.translationKey,
    metadata: message.metadata,
    createdTimestamp: new Date(message.timestamp),
    updatedTimestamp: message.lastUpdatedTimestamp
      ? new Date(message.lastUpdatedTimestamp)
      : null,
    deletedTimestamp: message.deletedTimestamp
      ? new Date(message.deletedTimestamp)
      : null,
    // TODO: is `seen` properly live updating? I don't think it is. Too much
    // memoization?
    seen: message.seen,
    seenBy: message.seenBy.map((user) => user.externalID),
    extraClassnames: message.extraClassnames,
    attachments,
    reactions: convertMessageReactionsToMessageDataReactions(message.reactions),
    skipLinkPreviews: message.skipLinkPreviews,
  };
}

export function externalizeMessageContent(
  content: MessageContent,
  userByInternalID: (id: UUID) => UserFragment | undefined,
): MessageContent {
  return content.map((node) => {
    if (node.type === MessageNodeType.MENTION) {
      const user = userByInternalID(node.user.id);
      // If this user isn't available (it's from another application, it's
      // been deleted, etc), we don't want to explode, so just put in an
      // externalized ID for it.
      const id = user?.externalID
        ? user.externalID
        : externalizeID(node.user.id);
      return {
        ...node,
        user: { id },
      };
    } else if ('children' in node) {
      return {
        ...node,
        children: externalizeMessageContent(node.children, userByInternalID),
      };
    }
    return node;
  });
}

/**
 * Convert a message from external IDs to internal IDs.
 *
 * WARNING: This is not reliable and should only be used for things like
 * optimistic rendering where if it's wrong it's only wrong for a short while.
 * If you need to do this in a fully-correct way, you need to send the content
 * to the backend and use the functions in
 * server/src/public/routes/platform/messages/util.ts.
 */
export function internalizeMessageContent_ONLY_BEST_EFFORT(
  content: MessageContent,
  userByExternalID: (id: UUID) => UserFragment | undefined,
): MessageContent {
  return content.map((node) => {
    if (node.type === MessageNodeType.MENTION) {
      const user = userByExternalID(node.user.id);
      let id: string;
      if (user) {
        id = user.id;
      } else if (!user && isExternalizedID(node.user.id)) {
        // In some circumstances, we may send through a node that has an
        // externalized ID (cord:abcd1234-internal-uuid-bcde) instead of the
        // proper external ID, if we needed to fill it out and the user's
        // external ID wasn't available in the browser, so handle that case
        id = extractInternalID(node.user.id)!;
      } else {
        // If this user isn't available (eg, it hasn't been loaded) we don't
        // want to explode, so just leave it alone.
        //
        // (THIS IS WHY IT'S BEST EFFORT.)
        id = node.user.id;
      }
      return {
        ...node,
        user: { id },
      };
    } else if ('children' in node) {
      return {
        ...node,
        children: internalizeMessageContent_ONLY_BEST_EFFORT(
          node.children,
          userByExternalID,
        ),
      };
    }
    return node;
  });
}

export function getThreadSummary(
  thread: Omit<
    ThreadFragment,
    'initialMessagesInclDeleted' | 'resolvedTimestamp'
  > & {
    messages: MessageFragment[];
    resolvedTimestamp: Date | string | null;
  },
  userByInternalID: (id: UUID) => UserFragment | undefined,
): ThreadSummary {
  const firstMessage = thread.messages[0];
  const lastMessage = thread.messages[thread.messages.length - 1];

  const coreThreadData = getThreadData(thread, userByInternalID);

  return {
    ...coreThreadData,
    unread: thread.newMessagesCount,
    viewerIsThreadParticipant: thread.viewerIsThreadParticipant,
    firstMessage: firstMessage
      ? getMessageData({
          message: firstMessage,
          thread,
          userByInternalID,
        })
      : null,
    lastMessage: lastMessage
      ? getMessageData({
          message: lastMessage,
          thread,
          userByInternalID,
        })
      : null,
  };
}

export function getThreadData(
  thread: Omit<
    ThreadFragment,
    'initialMessagesInclDeleted' | 'resolvedTimestamp'
  > & {
    resolvedTimestamp: Date | string | null;
  },
  userByInternalID: (id: UUID) => UserFragment | undefined,
): CoreThreadData {
  const externalThreadID = thread.externalID ?? externalizeID(thread.id);
  const subscribers = thread.participants
    .filter((p) => p.subscribed && p.user?.externalID)
    .map((p) => p.user!.externalID);

  return {
    id: externalThreadID,
    organizationID: thread.externalOrgID,
    groupID: thread.externalOrgID,
    total: thread.messagesCountExcludingDeleted,
    userMessages: thread.userMessagesCount,
    actionMessages: thread.actionMessagesCount,
    deletedMessages:
      thread.allMessagesCount - thread.messagesCountExcludingDeleted,
    resolved: thread.resolved,
    resolvedTimestamp: thread.resolvedTimestamp
      ? new Date(thread.resolvedTimestamp)
      : null,
    participants: thread.participants.map((participant) => {
      return {
        lastSeenTimestamp: participant.lastSeenTimestamp
          ? new Date(participant.lastSeenTimestamp)
          : null,
        userID: participant.user ? participant.user.externalID : null,
        displayName: participant.user ? participant.user.displayName : null,
      };
    }),
    mentioned: thread.mentioned.map((mention) => mention.externalID),
    subscribers: subscribers,
    repliers: thread.replyingUserIDs.map(
      (u) => userByInternalID(u)?.externalID ?? '',
    ),
    actionMessageRepliers: thread.actionMessageReplyingUserIDs.map(
      (u) => userByInternalID(u)?.externalID ?? '',
    ),
    typing: thread.typingUsers.map((user) => user.externalID),
    name: thread.name ?? '',
    url: thread.url,
    location: thread.location,
    metadata: thread.metadata,
    extraClassnames: thread.extraClassnames,
  };
}
