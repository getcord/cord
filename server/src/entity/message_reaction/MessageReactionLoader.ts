import DataLoader from 'dataloader';

import {
  inKeyOrder,
  inKeyOrderGroupedCustom,
} from 'server/src/entity/base/util.ts';
import { MessageReactionEntity } from 'server/src/entity/message_reaction/MessageReactionEntity.ts';
import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';

export class MessageReactionLoader {
  dataloader: DataLoader<UUID, MessageReactionEntity | null>;
  dataloaderForMessage: DataLoader<UUID, MessageReactionEntity[]>;

  constructor(
    private viewer: Viewer,
    cache = false,
  ) {
    this.dataloader = new DataLoader(
      async (keys) => {
        const messageReactions = await MessageReactionEntity.findAll({
          where: {
            id: keys as UUID[],
          },
        });

        return inKeyOrder(messageReactions, keys);
      },
      { cache },
    );

    this.dataloaderForMessage = new DataLoader(
      async (keys) => {
        const messageReactions = await MessageReactionEntity.findAll({
          where: { messageID: keys },
          // Intentional array of arrays here
          order: [['timestamp', 'ASC']],
        });

        return inKeyOrderGroupedCustom(
          messageReactions,
          keys,
          (r) => r.messageID,
        );
      },
      { cache },
    );
  }

  async loadReactionNoOrgCheck(id: UUID) {
    return await this.dataloader.load(id);
  }

  async loadReactionsForMessageNoOrgCheck(
    messageID: UUID,
  ): Promise<MessageReactionEntity[]> {
    return await this.dataloaderForMessage.load(messageID);
  }

  async loadReactionForMessageByUser(messageID: UUID, unicodeReaction: string) {
    const userID = assertViewerHasUser(this.viewer);

    const reactionEntity = await MessageReactionEntity.findOne({
      where: {
        messageID,
        userID,

        unicodeReaction,
      },
    });

    return reactionEntity;
  }

  clearAll() {
    this.dataloader.clearAll();
    this.dataloaderForMessage.clearAll();
  }
}
