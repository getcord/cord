import { v4 as uuid } from 'uuid';
import * as ReactDOM from 'react-dom';
import type {
  AnnotationAttachmentInput,
  MessageAnnotationAttachmentFragment,
  MessageFragment,
  TaskFragment,
  TaskInput,
  UserFragment,
  TaskInputType,
} from 'external/src/graphql/operations.ts';

import { UNDO_DELETE_MESSAGE_TIMEOUT_SECONDS } from '@cord-sdk/react/common/const/Timing.ts';
import type { PageVisitorWithDate } from 'external/src/context/page/PageVisitorsContext.ts';
import type {
  ComposerAnnotationAttachmentType,
  ComposerAttachment,
  ComposerFileAttachmentType,
} from 'external/src/context/composer/ComposerState.ts';
import type {
  FileAttachmentInput,
  ElementOf,
  MessageAnnotation,
} from 'common/types/index.ts';
import type { MessageWithTask } from 'external/src/graphql/custom.ts';
import { isNotNull } from 'common/util/index.ts';
import type { ThreadData } from 'external/src/context/threads2/ThreadsContext2.tsx';

export function canUndoMessageDelete(date: Date, now: number): boolean {
  // Checks whether a message should have the undo button after deleting a message
  const secondsSinceDeleted = (now - date.getTime()) / 1000;
  return secondsSinceDeleted <= UNDO_DELETE_MESSAGE_TIMEOUT_SECONDS;
}

export function isUserAuthorOfMessage(
  message: MessageFragment,
  externalUserId: string | null | undefined,
) {
  return !externalUserId || externalUserId === message.source.externalID;
}

export function getUnseenReactions(
  thread: ThreadData | null,
  message: MessageFragment,
  externalUserId: string | null | undefined,
) {
  const threadParticipant = thread?.participants.find(
    (p) => p?.user?.externalID === externalUserId,
  );

  return isUserAuthorOfMessage(message, externalUserId)
    ? message.reactions.filter(
        (reaction) =>
          reaction.timestamp >
            (threadParticipant?.lastSeenTimestamp ?? Infinity) &&
          reaction.user.externalID !== externalUserId,
      )
    : [];
}

export function usersSortedByPresence(
  visitors: PageVisitorWithDate[],
  activeUsers: UserFragment[],
) {
  const presentUsers = activeUsers.sort((user1, user2) =>
    // order by userID so it's consistent
    user1.id < user2.id ? -1 : 1,
  );
  const otherVisitors = visitors
    .filter(({ user }) => !activeUsers.some(({ id }) => user.id === id))
    .sort((user1, user2) => user2.lastSeen.getTime() - user1.lastSeen.getTime())
    .map(({ user }) => user);
  return [...presentUsers, ...otherVisitors];
}

export const messageAttachmentToComposerAttachment = (
  attachment: ElementOf<MessageFragment['attachments']>,
): ComposerAttachment | null => {
  switch (attachment.__typename) {
    case 'MessageFileAttachment': {
      if (!attachment.file) {
        return null;
      }

      return {
        id: attachment.id,
        type: 'file',
        file: {
          id: attachment.file.id,
          name: attachment.file.name,
          mimeType: attachment.file.mimeType,
          url: attachment.file.url,
          uploadStatus: attachment.file.uploadStatus,
          size: attachment.file.size,
        },
      };
    }

    case 'MessageAnnotationAttachment': {
      return {
        type: 'annotation',
        id: attachment.id,
        location:
          attachment.location === null
            ? null
            : {
                selector: attachment.location.selector,
                x: attachment.location.x,
                y: attachment.location.y,
                iframeSelectors: attachment.location.iframeSelectors,
                onChart: attachment.location.onChart,
                textConfig: attachment.location.textConfig,
                elementIdentifier: attachment.location.elementIdentifier
                  ? {
                      identifier:
                        attachment.location.elementIdentifier.identifier,
                      version: attachment.location.elementIdentifier.version,
                    }
                  : null,
                highlightedTextConfig:
                  attachment.location.highlightedTextConfig,
                additionalTargetData: attachment.location.additionalTargetData,
                multimediaConfig: attachment.location.multimediaConfig,
              },
        customLocation: attachment.customLocation,
        customHighlightedTextConfig: attachment.customHighlightedTextConfig,
        customLabel: attachment.customLabel,
        coordsRelativeToTarget: attachment.coordsRelativeToTarget,
        screenshot: attachment.screenshot
          ? {
              id: attachment.screenshot.id,
              name: attachment.screenshot.name,
              mimeType: attachment.screenshot.mimeType,
              url: attachment.screenshot.url,
              uploadStatus: attachment.screenshot.uploadStatus,
              size: attachment.screenshot.size,
            }
          : null,
        blurredScreenshot: attachment.blurredScreenshot
          ? {
              id: attachment.blurredScreenshot.id,
              name: attachment.blurredScreenshot.name,
              mimeType: attachment.blurredScreenshot.mimeType,
              url: attachment.blurredScreenshot.url,
              uploadStatus: attachment.blurredScreenshot.uploadStatus,
              size: attachment.blurredScreenshot.size,
            }
          : null,
        size: attachment.screenshot?.size ?? 0,
        message: {
          source: {
            id: attachment.message.source.id,
          },
        },
      };
    }

    case 'MessageScreenshotAttachment':
    case 'MessageLinkPreview':
      return null;
  }
};

export const composerAttachmentToMessageAttachment = (
  attachment: ComposerAttachment,
): ElementOf<MessageFragment['attachments']> => {
  switch (attachment.type) {
    case 'file': {
      return {
        __typename: 'MessageFileAttachment',
        id: attachment.id,
        file: {
          __typename: 'File',
          id: attachment.file.id,
          name: attachment.file.name,
          mimeType: attachment.file.mimeType,
          url: attachment.file.url,
          uploadStatus: attachment.file.uploadStatus,
          size: attachment.file.size,
        },
      };
    }
    case 'annotation': {
      return {
        __typename: 'MessageAnnotationAttachment',
        id: attachment.id,
        location: attachment.location,
        customLocation: attachment.customLocation,
        customHighlightedTextConfig: attachment.customHighlightedTextConfig,
        customLabel: attachment.customLabel,
        coordsRelativeToTarget: attachment.coordsRelativeToTarget,
        screenshot: attachment.screenshot
          ? {
              __typename: 'File',
              id: attachment.screenshot.id,
              mimeType: attachment.screenshot.mimeType,
              name: attachment.screenshot.name,
              url: attachment.screenshot.url,
              uploadStatus: attachment.screenshot.uploadStatus,
              size: attachment.screenshot.size,
            }
          : null,

        blurredScreenshot: attachment.blurredScreenshot
          ? {
              __typename: 'File',
              id: attachment.blurredScreenshot.id,
              mimeType: attachment.blurredScreenshot.mimeType,
              name: attachment.blurredScreenshot.name,
              url: attachment.blurredScreenshot.url,
              uploadStatus: attachment.blurredScreenshot.uploadStatus,
              size: attachment.blurredScreenshot.size,
            }
          : null,
        message: {
          source: {
            id: attachment.message.source.id,
          },
        },
      };
    }
  }
};

export function composerAttachmentsToInputs(attachments: ComposerAttachment[]) {
  const fileAttachments: FileAttachmentInput[] = [];
  const annotationAttachments: AnnotationAttachmentInput[] = [];
  for (const attachment of attachments) {
    if (attachment.type === 'file') {
      fileAttachments.push({
        id: attachment.id,
        fileID: attachment.file.id,
      });
    } else if (attachment.type === 'annotation') {
      const targetData = attachment.location?.additionalTargetData;
      annotationAttachments.push({
        id: attachment.id,
        screenshotFileID: attachment.screenshot
          ? attachment.screenshot.id
          : null,
        blurredScreenshotFileID: attachment.blurredScreenshot
          ? attachment.blurredScreenshot.id
          : null,
        location: attachment.location
          ? {
              ...attachment.location,
              // prefixCls deprecated 16 Dec
              // Replace with undefined to satisfy TS until we take it out
              additionalTargetData: !targetData
                ? null
                : {
                    ...targetData,
                    reactTree: !targetData.reactTree
                      ? null
                      : { ...targetData.reactTree, prefixCls: undefined },
                  },
              highlightedTextConfig: attachment.location.highlightedTextConfig,
            }
          : null,
        customLocation: attachment.customLocation,
        customLabel: attachment.customLabel,
        customHighlightedTextConfig: attachment.customHighlightedTextConfig,
        coordsRelativeToTarget: attachment.coordsRelativeToTarget,
      });
    }
  }
  return { fileAttachments, annotationAttachments };
}

export function getSecondsSinceTimestamp(timestamp: string) {
  const messageTime = new Date(timestamp).getTime();
  const now = Date.now();
  return (now - messageTime) / 1000;
}

export function isFileComposerAttachment(
  attachment: ComposerAttachment,
): attachment is ComposerFileAttachmentType {
  return attachment.type === 'file';
}

export function isAnnotationComposerAttachment(
  attachment: ComposerAttachment,
): attachment is ComposerAnnotationAttachmentType {
  return attachment.type === 'annotation';
}

export function attachmentToAnnotation(
  attachment:
    | MessageAnnotationAttachmentFragment
    | ComposerAnnotationAttachmentType,
) {
  return {
    id: attachment.id,
    location: attachment.location,
    customLocation: attachment.customLocation,
    customHighlightedTextConfig: attachment.customHighlightedTextConfig,
    customLabel: attachment.customLabel,
    coordsRelativeToTarget: attachment.coordsRelativeToTarget,
    sourceID: attachment.message.source.id,
  };
}

export function createNewEmptyTaskInput(type: TaskInputType): TaskInput {
  return {
    id: uuid(),
    done: false,
    todos: [],
    assigneeIDs: [],
    doneStatusUpdate: undefined,
    type,
  };
}

export function taskFragmentToInput(
  task: TaskFragment,
  doneStatusUpdate?: TaskInput['doneStatusUpdate'],
): TaskInput {
  return {
    id: task.id,
    done: task.done,
    assigneeIDs: task.assignees.filter(isNotNull).map((user) => user.id),
    doneStatusUpdate,
    // This currently just removes GraphQL __typename property
    todos: task.todos.map((todo) => ({ done: todo.done, id: todo.id })),
    type: task.thirdPartyReferences[0]?.type || 'cord',
  };
}

export const messageHasTask = (
  message: MessageFragment | undefined,
): message is MessageWithTask => Boolean(message?.task);

export const taskHasTodos = (task: TaskFragment) => task.todos.length > 0;

export const updateTaskDoneStatus = (
  task: TaskFragment,
  done: boolean,
  user: UserFragment,
) => {
  return {
    ...task,
    done,
    todos: task.todos.map((todo) => ({ ...todo, done })),
    doneStatusLastUpdatedBy: user,
  };
};

export function doNothing() {
  // do nothing
}

export function removeLinebreaks(text: string) {
  return text.replace(/[\r\n]+/gm, '');
}

export function getCssText(element: Element) {
  return (element as HTMLElement)?.style?.cssText?.replaceAll(' ', '') ?? '';
}

/**
 * This function turns the `[style]` part of a Monaco Editor line selector
 * from one with no spaces, to one with spaces. Monaco adds these spaces when users
 * add new lines to the editor. We always save the selector without whitespaces, so
 * this function helps us covers the scenario with extra whitespaces.
 * @example
 * // From
 * `div > #container > [style="top:54px;height:18px;"]`
 * // to
 * `div > #container > [style="top: 54px; height: 18px;"]`
 */
export function getMonacoLineSelectorWithSpaces(selector: string) {
  const topInPx = selector
    .match(/top:\d+px/)?.[0]
    ?.split(':')
    .pop();
  const heightInPx = selector
    .match(/height:\d+px/)?.[0]
    ?.split(':')
    .pop();
  const newStyle = `[style="top: ${topInPx}; height: ${heightInPx};"]`;
  const oldSelectorMinusStyles = selector.substring(
    0,
    selector.indexOf('[style="top'),
  );
  return oldSelectorMinusStyles + newStyle;
}

/**
Batching stops 20 dispatch calls causing 20 re-renders. It is unstable
in that you shouldn't rely on it, but use is recommended and it is
used in redux (https://github.com/reduxjs/react-redux/issues/1091,
https://twitter.com/dan_abramov/status/1103399900371447819)
*/
export function batchReactUpdates(updateFn: () => void) {
  ReactDOM.unstable_batchedUpdates(updateFn);
}

export const getThreadLatestTimestamp = (thread: {
  messages: MessageFragment[];
}) => {
  if (thread.messages.length === 0) {
    return new Date().getTime();
  }

  return new Date(
    thread.messages[thread.messages.length - 1].timestamp,
  ).getTime();
};

export function getHighlightedTextConfigFromAnnotation(
  annotation: MessageAnnotation | ComposerAnnotationAttachmentType,
) {
  return (
    annotation.customHighlightedTextConfig ??
    annotation.location?.highlightedTextConfig ??
    null
  );
}
