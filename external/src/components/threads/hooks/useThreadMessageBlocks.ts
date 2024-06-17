import { useCallback, useMemo } from 'react';
import { CONTIGUOUS_MESSAGE_BLOCK_TIMEOUT_SECONDS } from 'common/const/Timing.ts';
import type { MessageFragment } from 'external/src/graphql/operations.ts';
import type { UUID } from 'common/types/index.ts';

export function useThreadMessageBlocks(
  messages: MessageFragment[],
  firstMessageIDsOfEachLoad: Set<string>,
  initialFirstUnseenMessageID: UUID | null = null,
): { blocks: MessageFragment[][] } {
  const getBlocks = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    (messages: MessageFragment[]) => {
      const blocks: MessageFragment[][] = [];
      let currentBlockMessages: MessageFragment[] = [];

      let lastSource: MessageFragment['source'] | null = null;
      let lastMessage: MessageFragment | null = null;

      let lastTimestampSeconds: number | null = null;

      let message: MessageFragment = messages[0];

      function startNewBlock() {
        currentBlockMessages = [];
        currentBlockMessages.push(message);
        blocks.push(currentBlockMessages);
      }
      function continueCurrentBlock() {
        currentBlockMessages.push(message);
      }
      function isFirstMessageOfLoad() {
        return firstMessageIDsOfEachLoad.has(message.id);
      }
      function wasFirstUnseenMessage() {
        return message.id === initialFirstUnseenMessageID;
      }
      function hasAuthorChanged() {
        return lastSource && message.source.id !== lastSource.id;
      }
      function hasSentLocationChanged() {
        return (
          lastMessage &&
          (message.importedSlackMessageType !==
            lastMessage.importedSlackMessageType ||
            (lastMessage &&
              message.isFromEmailReply !== lastMessage.isFromEmailReply))
        );
      }
      function hasEnoughTimePassedForNewBlock(currentSeconds: number) {
        return (
          lastTimestampSeconds &&
          currentSeconds - lastTimestampSeconds >
            CONTIGUOUS_MESSAGE_BLOCK_TIMEOUT_SECONDS
        );
      }

      function isPreviousMessageActionMessage(messageIndex: number) {
        if (messageIndex === 0) {
          return false;
        }

        return messages[messageIndex - 1].type !== 'user_message';
      }

      for (let i = 0; i < messages.length; i++) {
        message = messages[i];
        const currentSeconds = new Date(message.timestamp).getTime() / 1000;

        if (
          i === 0 ||
          isFirstMessageOfLoad() ||
          hasAuthorChanged() ||
          hasSentLocationChanged() ||
          wasFirstUnseenMessage() ||
          hasEnoughTimePassedForNewBlock(currentSeconds) ||
          isPreviousMessageActionMessage(i)
        ) {
          startNewBlock();
        } else {
          continueCurrentBlock();
        }
        lastSource = message.source;
        lastMessage = message;
        lastTimestampSeconds = currentSeconds;
      }
      return blocks;
    },
    [firstMessageIDsOfEachLoad, initialFirstUnseenMessageID],
  );

  return useMemo(() => {
    return {
      blocks: [[messages[0]], ...getBlocks(messages.slice(1))],
    };
  }, [messages, getBlocks]);
}
