import { useCallback, useContext } from 'react';
import { v4 as uuid } from 'uuid';

import type {
  MessageAttachment,
  MessageFileAttachment,
  Reaction,
} from '@cord-sdk/types';
import { CordContext } from '../../../contexts/CordContext.js';
import { thread as ThreadSDK } from '../../../index.js';
import type {
  ComposerMessageData,
  SendComposerProps,
} from '../../../betaV2.js';

const EMPTY_ATTACHMENTS: MessageAttachment[] = [];
const EMPTY_REACTIONS: Reaction[] = [];

type UseEditSubmit = {
  initialValue?: ComposerMessageData;
  messageID: string;
};

export function useEditSubmit(args: UseEditSubmit) {
  const { messageID, initialValue } = args;

  const messageData = ThreadSDK.useMessage(messageID);
  const threadData = ThreadSDK.useThread(messageData?.threadID, {
    skip: !messageData?.threadID,
  });

  const initialAttachments = initialValue?.attachments ?? EMPTY_ATTACHMENTS;
  const { sdk: cord } = useContext(CordContext);
  return useCallback(
    ({ message }: { message: ComposerMessageData }) => {
      const { reactions, attachments, ...restMessage } = message;
      const threadID = threadData.thread?.id;

      if (!threadID) {
        throw Error('Thread ID is required to edit a message.');
      }

      const initialFileAttachments = initialAttachments.filter(
        isMessageFileAttachment,
      );
      const filesAttachments = (attachments ?? []).filter(
        isMessageFileAttachment,
      );
      const oldAttachmentIDs = new Set(
        initialFileAttachments?.map((a) => a.id),
      );
      const newAttachmentIDs = new Set(filesAttachments?.map((a) => a.id));
      const initialReactions = new Set(
        (initialValue?.reactions ?? []).map((r) => r.reaction) ??
          EMPTY_REACTIONS,
      );
      const newReactions = new Set(
        (reactions ?? []).map((r) => r.reaction) ?? EMPTY_REACTIONS,
      );
      void cord?.thread.updateMessage(threadID, messageID, {
        ...restMessage,
        addAttachments: filesAttachments
          .filter((a) => !oldAttachmentIDs.has(a.id))
          .map((a) => ({ id: a.id, type: 'file' })),
        removeAttachments:
          initialFileAttachments
            ?.filter((a) => !newAttachmentIDs.has(a.id))
            .map((a) => ({ id: a.id, type: 'file' })) ?? [],
        addReactions:
          (reactions ?? [])
            .filter((r) => !initialReactions.has(r.reaction))
            .map((r) => r.reaction) ?? [],
        removeReactions:
          (initialValue?.reactions ?? [])
            .filter((r) => !newReactions.has(r.reaction))
            .map((r) => r.reaction) ?? [],
      });
    },
    [
      cord?.thread,
      messageID,
      initialAttachments,
      initialValue?.reactions,
      threadData,
    ],
  );
}

type UseCreateSubmit = {
  initialValue?: ComposerMessageData;
  threadID?: string;
  createThread?: SendComposerProps['createThread'];
};

export function useCreateSubmit(args: UseCreateSubmit) {
  const { threadID, createThread } = args;
  const { sdk: cord } = useContext(CordContext);
  return useCallback(
    async ({ message }: { message: ComposerMessageData }) => {
      const { reactions, content, attachments, ...restMessage } = message;
      const filesAttachments = (attachments ?? []).filter(
        isMessageFileAttachment,
      );
      const url = window.location.href;

      await cord?.thread.sendMessage(threadID ?? uuid(), {
        ...restMessage,
        content: content ?? [],
        addAttachments: filesAttachments.map((a) => ({
          id: a.id,
          type: 'file',
        })),
        addReactions: (reactions ?? []).map((r) => r.reaction),
        createThread: {
          location: { location: url },
          url,
          name: document.title,
          ...createThread,
          groupID: createThread?.groupID ?? cord.groupID,
        },
      });
    },
    [cord?.thread, cord?.groupID, threadID, createThread],
  );
}

function isMessageFileAttachment(
  attachment: MessageAttachment,
): attachment is MessageFileAttachment {
  return attachment.type === 'file';
}
