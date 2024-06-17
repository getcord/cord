import type { Transaction } from 'sequelize';
import {
  MessageReactionEntity,
  REACTION_MAX_LENGTH,
} from 'server/src/entity/message_reaction/MessageReactionEntity.ts';
import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import type { RequestContextLoaders } from 'server/src/RequestContextLoaders.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';

export class MessageReactionMutator {
  constructor(
    private viewer: Viewer,
    private loaders: RequestContextLoaders | null,
  ) {}

  async createOne(
    messageID: UUID,
    unicodeReaction: string,
    timestamp?: Date,
    transaction?: Transaction,
  ): Promise<MessageReactionEntity> {
    const userID = assertViewerHasUser(this.viewer);

    if (unicodeReaction.length > REACTION_MAX_LENGTH) {
      throw new ApiCallerError('invalid_field', {
        message: `Reaction is too long, must be less than ${REACTION_MAX_LENGTH} characters`,
      });
    }

    const result = await MessageReactionEntity.create(
      {
        userID: userID,
        messageID,
        unicodeReaction,
        timestamp,
      },
      { transaction },
    );
    this.loaders?.messageReactionLoader.clearAll();
    return result;
  }

  async deleteReaction(messageID: UUID, reactionID: UUID): Promise<boolean> {
    const userID = assertViewerHasUser(this.viewer);

    const deleteRow = await MessageReactionEntity.destroy({
      where: {
        id: reactionID,
        userID,
        messageID,
      },
    });
    this.loaders?.messageReactionLoader.clearAll();
    return deleteRow === 1;
  }

  async deleteUnicodeReaction(
    messageID: UUID,
    unicodeReaction: string,
    transaction?: Transaction,
  ): Promise<boolean> {
    const userID = assertViewerHasUser(this.viewer);

    const deleteRow = await MessageReactionEntity.destroy({
      where: {
        userID,
        messageID,
        unicodeReaction,
      },
      transaction,
    });

    this.loaders?.messageReactionLoader.clearAll();
    return deleteRow === 1;
  }
}
