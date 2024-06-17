import type { RefObject } from 'react';
import { useCallback, useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';

import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { removeEmptyTopLevelParagraphs } from 'external/src/editor/util.ts';
import { ComposerContext } from 'external/src/context/composer/ComposerContext.ts';
import { PageContext } from 'external/src/context/page/PageContext.ts';
import {
  getMentionedUserIDs,
  getReferencedUserIDsAndNames,
} from 'common/util/index.ts';
import type {
  MessageFragment,
  TaskFragment,
} from 'external/src/graphql/operations.ts';
import { useCreateThreadMessageMutation } from 'external/src/graphql/operations.ts';
import {
  composerAttachmentsToInputs,
  composerAttachmentToMessageAttachment,
  isAnnotationComposerAttachment,
} from 'external/src/lib/util.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { useMessageUpdater } from 'external/src/effects/useMessageUpdater.ts';
import { EditorCommands } from 'external/src/editor/commands.ts';
import { useTypingUpdater } from 'external/src/components/chat/composer/hooks/useTypingUpdater.ts';
import { AnnotationsOnPageContext } from 'external/src/context/annotationsOnPage/AnnotationsOnPageContext.ts';
import { ThreadNameContext } from 'external/src/context/page/ThreadNameContext.tsx';
import { PageUrlContext } from 'external/src/context/page/PageUrlContext.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { useShareThreadToSlack } from 'external/src/effects/useShareThreadToSlack.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { useCaptureScreenshot } from 'external/src/effects/useCaptureScreenshot.ts';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { ScreenshotConfigContext } from 'external/src/context/screenshotConfig/ScreenshotConfigContext.tsx';
import { externalizeID } from 'common/util/externalIDs.ts';
import type { EntityMetadata } from 'common/types/index.ts';
import type {
  ClientCreateMessage,
  ComposerWebComponentEvents,
} from '@cord-sdk/types';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';
import {
  externalizeMessageContent,
  getThreadSummary,
  internalizeMessageContent_ONLY_BEST_EFFORT,
} from 'common/util/convertToExternal/thread.ts';
import { ResetComposerStateAction } from 'external/src/context/composer/actions/ResetComposerState.ts';
import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';

export type MessageSentStatus = {
  success: boolean;
  error?: string;
};

export function useMessageSender({
  isDraftThread,
  threadUrl,
  messageMetadata = {},
  threadMetadata = {},
  dispatchMessageEditEndEvent,
}: {
  isDraftThread: boolean;
  threadUrl?: string;
  messageMetadata?: EntityMetadata;
  threadMetadata?: EntityMetadata;
  composerRef?: RefObject<HTMLDivElement>;
  dispatchMessageEditEndEvent?: () => void;
}) {
  const { beforeMessageCreate } =
    useContextThrowingIfNoProvider(ConfigurationContext);
  const threadsContext = useContextThrowingIfNoProvider(ThreadsContext2);
  const threadContext2 = useContextThrowingIfNoProvider(Thread2Context);
  const { threadID, externalThreadID, thread } = threadContext2;

  const slackChannelToShareTo = threadContext2.initialSlackShareChannel;

  const { logEvent } = useLogger();

  const { addAnnotationToPage } = useContextThrowingIfNoProvider(
    AnnotationsOnPageContext,
  );

  const updateTyping = useTypingUpdater();

  const { user: viewer } = useContextThrowingIfNoProvider(IdentityContext);
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);
  const {
    byInternalID: { usersByID: usersByInternalID, userByID: userByInternalID },
    byExternalID: { userByID: userByExternalID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const {
    state: { task, attachments, editingMessageID },
    dispatch,
    getValue,
    clearComposer,
    resetComposerValue,
    editor,
    composerValid,
  } = useContextThrowingIfNoProvider(ComposerContext);
  const pageContext = useContextThrowingIfNoProvider(PageContext);
  const { threadName } = useContextThrowingIfNoProvider(ThreadNameContext);
  const pageUrl = useContextThrowingIfNoProvider(PageUrlContext);
  const screenshotConfig = useContextThrowingIfNoProvider(
    ScreenshotConfigContext,
  );
  const cordElement = useContextThrowingIfNoProvider(ComponentContext)?.element;

  const takeScreenshotWhenCreatingThread = useFeatureFlag(
    FeatureFlags.TAKE_SCREENSHOT_WHEN_CREATING_THREAD,
  );
  const takeScreenshotWhenSendingMessage = useFeatureFlag(
    FeatureFlags.TAKE_SCREENSHOT_WHEN_SENDING_MESSAGE,
  );

  const {
    screenshotOptions: { blur: blurScreenshotsOnCapture, captureWhen },
    threadOptions,
  } = useContextThrowingIfNoProvider(ConfigurationContext);

  const captureScreenshot = useCaptureScreenshot({
    sidebarVisible: false,
    blurScreenshotsOnCapture,
    screenshotConfig,
  });

  const { fileAttachments, annotationAttachments } = useMemo(
    () => composerAttachmentsToInputs(attachments),
    [attachments],
  );

  const [createThreadMessage] = useCreateThreadMessageMutation();

  const shareThreadToSlack = useShareThreadToSlack();

  const addMessageToChannel = useCallback(async () => {
    if (!viewer) {
      throw new Error("Can't add a message without being logged in");
    }
    const location = threadsContext.location;
    const includePageContext = location !== 'inbox';

    const value = getValue();

    const messageID = uuid();
    const newMessage = {
      id: messageID,
      content: removeEmptyTopLevelParagraphs(value),
      url: threadUrl ?? thread?.url ?? (includePageContext ? pageUrl : null),
    };

    for (const attachment of attachments) {
      if (isAnnotationComposerAttachment(attachment)) {
        addAnnotationToPage({
          ...attachment,
          messageID,
          threadID,
          sourceID: viewer.id,
          isDraftThread,
        });
      }
    }

    const mentionedUsers = usersByInternalID(...getMentionedUserIDs(value));
    const referencedUserData = getReferencedUserIDsAndNames(value);
    const taskFragment: TaskFragment | null = task
      ? {
          __typename: 'Task',
          id: task.id,
          done: task.done,
          todos: task.todos,
          assignees: usersByInternalID(...task.assigneeIDs),
          doneStatusLastUpdatedBy: null,
          thirdPartyReferences:
            task.type === 'cord'
              ? []
              : [
                  {
                    type: task.type,
                    previewData: null,
                  },
                ],
        }
      : null;

    // Give the client a chance to modify the message before we do anything with it
    let clientCreateMessage: ClientCreateMessage = {
      id: externalizeID(newMessage.id),
      content: externalizeMessageContent(newMessage.content, userByInternalID),
      url: newMessage.url,
      metadata: messageMetadata,
      addAttachments: fileAttachments.map((a) => ({
        type: 'file',
        id: a.fileID,
      })),
      ...(isDraftThread && {
        createThread: {
          name: threadName ?? newMessage.url!,
          url: newMessage.url!,
          location: pageContext!.data,
          metadata: threadMetadata,
          groupID: organization?.externalID,
          addSubscribers: threadOptions?.additional_subscribers_on_create,
        },
      }),
    };
    if (beforeMessageCreate) {
      const response = await beforeMessageCreate(clientCreateMessage, {
        threadID: externalThreadID ?? externalizeID(threadID),
        firstMessage: (thread?.allMessagesCount ?? 0) === 0,
      });
      if (!response) {
        logEvent('message-send-failed');
        return { success: false };
      }
      clientCreateMessage = response;
    }

    const message: MessageFragment = {
      __typename: 'Message',
      id: newMessage.id,
      content: internalizeMessageContent_ONLY_BEST_EFFORT(
        clientCreateMessage.content,
        userByExternalID,
      ),
      url: clientCreateMessage.url ?? null,
      externalID: clientCreateMessage.id ?? externalizeID(newMessage.id),
      source: viewer,
      attachments: attachments
        // We don't attempt to optimistically render attachments that might have
        // been added in beforeMessageCreate because we don't have the file
        // details (like the URL), just the ID, so instead the best we can do is
        // cut down the composer-added attachments in case beforeMessageCreate
        // removed some
        .filter(
          (a) =>
            a.type !== 'file' ||
            clientCreateMessage.addAttachments?.some(
              (added) => added.id === a.file.id,
            ),
        )
        .map(composerAttachmentToMessageAttachment),
      seen: true,
      reactions: [],
      timestamp: new Date().toISOString(),
      deletedTimestamp: null,
      lastUpdatedTimestamp: null,
      importedFromSlackChannel: null,
      referencedUserData,
      task: taskFragment,
      importedSlackMessageType: null,
      slackURL: null,
      isFromEmailReply: false,
      type: 'user_message',
      iconURL: clientCreateMessage.iconURL ?? null,
      translationKey: clientCreateMessage.translationKey ?? null,
      metadata: clientCreateMessage.metadata ?? {},
      seenBy: [{ externalID: viewer.externalID }],
      extraClassnames: clientCreateMessage.extraClassnames ?? null,
      skipLinkPreviews: false,
    };

    // local optimistic message rendering
    if (isDraftThread) {
      threadsContext.addThread(
        threadID,
        externalThreadID ?? externalizeID(threadID),
        message,
        pageContext?.data || {},
        clientCreateMessage.createThread?.name ?? '',
      );
    } else {
      threadsContext.mergeMessage(threadID, message, true);
      threadsContext.setSubscribed(threadID, true);
    }

    const sendMessageMutation = (
      captureData: {
        screenshotId: string;
        blurredScreenshotId: string | null;
      } | null,
    ) =>
      createThreadMessage({
        variables: {
          input: {
            // Todo - get these types working
            content: undefined,
            // Send the content with external IDs to the server, they will get
            // converted back to internal IDs there
            externalContent: clientCreateMessage.content as any,
            task: (task ?? undefined) as any,
            url:
              clientCreateMessage.url ?? clientCreateMessage.createThread?.url,
            messageID: newMessage.id,
            fileAttachments: (clientCreateMessage.addAttachments ?? []).map(
              (a) => ({
                id: uuid(),
                fileID: a.id,
              }),
            ),
            // Deprecated for screenshotAttachment.
            // TODO remove once we deprecate on server too.
            screenshotID: undefined,
            screenshotAttachment: captureData
              ? {
                  id: uuid(),
                  screenshotFileID: captureData.screenshotId,
                  blurredScreenshotFileID: captureData.blurredScreenshotId,
                }
              : undefined,
            annotationAttachments,
            threadID,
            createNewThread: !!clientCreateMessage.createThread,
            newThreadMetadata: clientCreateMessage.createThread?.metadata ?? {},
            newMessageMetadata: clientCreateMessage.metadata ?? {},
            pageContext:
              includePageContext && clientCreateMessage.createThread?.location
                ? {
                    data: clientCreateMessage.createThread.location,
                    providerID: null,
                  }
                : null,
            pageName: clientCreateMessage.createThread?.name,
            threadOptions: undefined,
            externalMessageID: clientCreateMessage.id,
            type: undefined,
            addReactions: clientCreateMessage.addReactions,
            iconURL: clientCreateMessage.iconURL,
            translationKey: clientCreateMessage.translationKey,
            extraClassnames: clientCreateMessage.extraClassnames,
            createThread: clientCreateMessage.createThread
              ? {
                  location: clientCreateMessage.createThread.location,
                  url: clientCreateMessage.createThread.url,
                  name: clientCreateMessage.createThread.name,
                  metadata: clientCreateMessage.createThread.metadata,
                  extraClassnames:
                    clientCreateMessage.createThread.extraClassnames,
                  addSubscribers:
                    clientCreateMessage.createThread.addSubscribers,
                  subscribers: undefined, // deprecated
                }
              : undefined,
            skipLinkPreviews: clientCreateMessage.skipLinkPreviews,
          },
          _externalOrgID:
            organization?.externalID ??
            clientCreateMessage?.createThread?.groupID ??
            null,
        },
      })
        .then((response) => {
          if (response.errors) {
            logEvent('message-send-failed');
            console.error(response.errors[0].message);
            return { success: false, error: response.errors[0].message };
          }

          if (response.data?.createThreadMessage.success) {
            cordElement?.dispatchEvent(
              new CustomEvent<ComposerWebComponentEvents['send']>(
                `cord-composer:send`,
                {
                  bubbles: true,
                  composed: true,
                  detail: [
                    {
                      threadId: externalThreadID ?? externalizeID(threadID),
                      messageId: externalizeID(messageID),
                      thread:
                        thread && getThreadSummary(thread, userByInternalID),
                    },
                  ],
                },
              ),
            );
            logEvent('message-send-succeeded');
            if (slackChannelToShareTo) {
              void shareThreadToSlack({
                slackChannel: slackChannelToShareTo,
                threadID,
                isNewThread: true,
              });
            }
            return { success: true };
          } else {
            logEvent('message-send-failed');
            return { success: false };
          }
        })
        .catch((err) => {
          if (err instanceof Error) {
            return { success: false, error: err.message };
          } else {
            return { success: false };
          }
        });

    const takeScreenshotAndSendMessage = () =>
      captureScreenshot()
        .then((captureData) => {
          if (captureData) {
            return sendMessageMutation(captureData);
          } else {
            throw new Error(`Couldn't create screenshot`);
          }
        })
        // We don't want to lose the message
        .catch((_) => sendMessageMutation(null));

    let messageSentStatus: MessageSentStatus = { success: false };
    if (
      (isDraftThread &&
        (takeScreenshotWhenCreatingThread ||
          captureWhen.includes('new-thread'))) ||
      (!isDraftThread &&
        (takeScreenshotWhenSendingMessage ||
          captureWhen.includes('new-message')))
    ) {
      messageSentStatus = await takeScreenshotAndSendMessage();
    } else {
      messageSentStatus = await sendMessageMutation(null);
    }

    // count the number of things attached to the message, and log it
    const eventPayload = {
      annotations: 0,
      customAnnotations: 0,
      textAnnotations: 0,
      attachments: 0,
      mentions: mentionedUsers.length,
      newThread: isDraftThread,
      threadID,
    };

    for (const attachment of attachments) {
      if (attachment.type === 'annotation') {
        const isTextAnnotation = Boolean(
          attachment.location?.highlightedTextConfig ||
            attachment.customHighlightedTextConfig,
        );

        if (isTextAnnotation) {
          eventPayload.textAnnotations++;
        } else {
          eventPayload.annotations++;
        }

        const isCustomAnnotation = Boolean(attachment.customLocation);
        if (isCustomAnnotation) {
          eventPayload.customAnnotations++;
        }
      } else if (attachment.type === 'file') {
        eventPayload.attachments++;
      }
    }

    if (task) {
      logEvent('create-task', {
        method: 'composer-text',
        num_todos: task.todos.length,
        assignees: task.assigneeIDs,
        provider: task.type,
      });
    }
    logEvent('message-send-ui', eventPayload);
    return messageSentStatus;
  }, [
    viewer,
    threadsContext,
    getValue,
    threadUrl,
    pageUrl,
    usersByInternalID,
    task,
    userByInternalID,
    messageMetadata,
    fileAttachments,
    isDraftThread,
    threadName,
    pageContext,
    threadMetadata,
    beforeMessageCreate,
    userByExternalID,
    attachments,
    takeScreenshotWhenCreatingThread,
    captureWhen,
    takeScreenshotWhenSendingMessage,
    threadID,
    logEvent,
    addAnnotationToPage,
    thread,
    externalThreadID,
    createThreadMessage,
    annotationAttachments,
    threadOptions,
    organization?.externalID,
    cordElement,
    slackChannelToShareTo,
    shareThreadToSlack,
    captureScreenshot,
  ]);

  const { editMessage } = useMessageUpdater();
  const updateMessageInChannel = useCallback(async () => {
    if (!editingMessageID) {
      throw new Error('Message cannot be edited');
    }
    const value = removeEmptyTopLevelParagraphs(getValue());
    const messages =
      threadsContext.getThreadUpdatingRef(threadID).current?.messages ?? [];
    const prevMessage = messages.find(
      (message) => message.id === editingMessageID,
    );
    let taskFragment: TaskFragment | null = null;
    if (task && prevMessage) {
      const prevTask = prevMessage.task;
      let doneStatusLastUpdatedBy = prevTask?.doneStatusLastUpdatedBy ?? null;
      if (task.doneStatusUpdate === 'update') {
        doneStatusLastUpdatedBy = viewer ?? null;
      } else if (task.doneStatusUpdate === 'remove') {
        doneStatusLastUpdatedBy = null;
      }
      taskFragment = {
        __typename: 'Task',
        id: task.id,
        done: task.done,
        assignees: usersByInternalID(...task.assigneeIDs),
        todos: task.todos,
        doneStatusLastUpdatedBy,
        thirdPartyReferences:
          task.type === 'cord'
            ? []
            : [
                {
                  type: task.type,
                  previewData: null,
                },
              ],
      };
    }

    const referencedUsers = getReferencedUserIDsAndNames(value);

    const contentHasChanged = !isEqual(prevMessage?.content, value);
    const tasksHaveChanged = prevMessage?.task?.id !== taskFragment?.id;
    const attachmentsHaveChanged = !isEqual(
      prevMessage?.attachments.map((item) => item.id),
      attachments.map((item) => item.id),
    );

    if (contentHasChanged || tasksHaveChanged || attachmentsHaveChanged) {
      editMessage({
        id: editingMessageID,
        content: value,
        fileAttachments,
        annotationAttachments,
        task: taskFragment,
        taskInput: task,
        referencedUsers,
      });
    }
    clearComposer();
    dispatchMessageEditEndEvent?.();
  }, [
    editingMessageID,
    getValue,
    threadsContext,
    threadID,
    task,
    attachments,
    clearComposer,
    dispatchMessageEditEndEvent,
    usersByInternalID,
    viewer,
    editMessage,
    fileAttachments,
    annotationAttachments,
  ]);

  const sendMessage = useCallback(async () => {
    if (!composerValid) {
      // We don't want to show an error if e.g. the composer
      // is empty and users press ENTER
      return { success: true };
    }

    EditorCommands.moveCursorToStart(editor);
    const clearedValue = clearComposer();
    updateTyping(false);

    if (!editingMessageID) {
      const sentStatus = await addMessageToChannel();
      if (!sentStatus.success) {
        resetComposerValue(clearedValue);
        dispatch(ResetComposerStateAction());
        EditorCommands.moveSelectionToEndOfText(editor);
      }
      return sentStatus;
    } else {
      // TODO: Handle message update error
      void updateMessageInChannel();
      return { success: true };
    }
  }, [
    composerValid,
    editor,
    dispatch,
    clearComposer,
    updateTyping,
    editingMessageID,
    addMessageToChannel,
    resetComposerValue,
    updateMessageInChannel,
  ]);

  return sendMessage;
}
