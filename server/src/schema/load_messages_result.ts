import type { UUID } from 'common/types/index.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export interface LoadMessagesResultData {
  threadID: UUID;
  messages: MessageEntity[];
  ignoreDeleted: boolean;
}

export const loadMessagesResultResolver: Resolvers['LoadMessagesResult'] = {
  async olderMessagesCount({ threadID, messages }, _args, context) {
    if (messages.length) {
      return await context.loaders.threadLoader.loadMessagesCountBeforeNoOrgCheck(
        threadID,
        messages[0].id,
      );
    } else {
      return 0;
    }
  },
};
