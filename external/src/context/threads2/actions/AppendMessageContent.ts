import type { UUID } from 'common/types/index.ts';
import { appendMessageContent } from 'common/util/appendMessageContent.ts';
import { action, actionReducer } from 'external/src/context/common.ts';
import type { ThreadsState } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';
import type { useLogger } from 'external/src/logging/useLogger.ts';

type AppendMessageContentPayload = {
  threadID: UUID;
  messageID: UUID;
  appendedContent: string;
  logger: ReturnType<typeof useLogger>;
};

export const AppendMessageContentAction = action<AppendMessageContentPayload>(
  ThreadsActions.APPEND_MESSAGE_CONTENT,
);

export const AppendMessageContentReducer = actionReducer(
  (
    state: ThreadsState,
    {
      threadID,
      messageID,
      appendedContent,
      logger,
    }: AppendMessageContentPayload,
  ) => {
    const thread = state.threadsData[threadID];
    if (!thread) {
      return state;
    }

    let found = false;
    const newMessages = thread.messages.map((message) => {
      if (message.id !== messageID) {
        return message;
      }

      const newContent = appendMessageContent(message.content, appendedContent);
      if (!newContent) {
        // This should be checked by AppendMessageHandler.
        logger.logError('Appending content to non-appendable message', {
          threadID,
          messageID,
        });
        return message;
      }

      found = true;
      return {
        ...message,
        content: newContent,
      };
    });

    if (!found) {
      return state;
    }

    return {
      ...state,
      threadsData: {
        ...state.threadsData,
        [thread.id]: {
          ...thread,
          messages: newMessages,
        },
      },
    };
  },
);
