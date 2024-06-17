import type { RefObject } from 'react';
import { useCallback } from 'react';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ComposerContext } from 'external/src/context/composer/ComposerContext.ts';
import { SetAttachmentsAction } from 'external/src/context/composer/actions/SetAttachments.ts';
import { SetEditingAction } from 'external/src/context/composer/actions/SetEditing.ts';
import { SetTaskAction } from 'external/src/context/composer/actions/SetTask.ts';
import {
  taskFragmentToInput,
  messageAttachmentToComposerAttachment,
} from 'external/src/lib/util.ts';
import type { MessageFragment } from 'external/src/graphql/operations.ts';
import type { ThreadData } from 'external/src/context/threads2/ThreadsContext2.tsx';
import {
  getMessageData,
  getThreadSummary,
} from 'common/util/convertToExternal/thread.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import type { MessageWebComponentEvents } from '@cord-sdk/types';

export function useSetComposerToEditMode() {
  const {
    dispatch: dispatchComposerAction,
    resetComposerValue,
    state: { editingMessageID },
  } = useContextThrowingIfNoProvider(ComposerContext);
  const {
    byInternalID: { userByID: userByInternalID },
  } = useContextThrowingIfNoProvider(UsersContext);

  return useCallback(
    ({
      message,
      thread,
      messageRef,
    }: {
      message: MessageFragment;
      thread: ThreadData | null;
      messageRef?: RefObject<HTMLDivElement>;
    }) => {
      // This hook gets called more than it should, because of our UI unnecessarily re-rendering.
      // We might be able to remove this check once we're sure editing a message won't re-render all messages.
      if (editingMessageID === message.id) {
        return;
      }
      dispatchComposerAction(SetEditingAction(message.id));
      // Update value in the composer context
      resetComposerValue(message.content ?? []);
      dispatchComposerAction(
        SetTaskAction(message.task ? taskFragmentToInput(message.task) : null),
      );
      // dispatch to set state of attachments in the composer context
      dispatchComposerAction(
        SetAttachmentsAction(
          message.attachments
            .map(messageAttachmentToComposerAttachment)
            .filter(
              (attachment): attachment is NonNullable<typeof attachment> =>
                attachment !== null,
            ),
        ),
      );
      messageRef?.current?.dispatchEvent(
        new CustomEvent<MessageWebComponentEvents['editstart']>(
          `cord-message:editstart`,
          {
            bubbles: true,
            composed: true,
            detail: [
              {
                threadId: thread!.externalID,
                messageId: message.externalID,
                thread: getThreadSummary(thread!, userByInternalID),
                message: getMessageData({
                  message,
                  thread: thread!,
                  userByInternalID,
                }),
              },
            ],
          },
        ),
      );
    },
    [
      dispatchComposerAction,
      editingMessageID,
      resetComposerValue,
      userByInternalID,
    ],
  );
}
