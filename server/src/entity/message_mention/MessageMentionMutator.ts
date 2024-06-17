import type { WhereOptions } from 'sequelize';
import { Op } from 'sequelize';

import { MessageMentionEntity } from 'server/src/entity/message_mention/MessageMentionEntity.ts';
import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
export class MessageMentionMutator {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  // createMessageMentions creates a mention (userID, messageID) for each user
  // in userIDs. It returns a list of userIDs for which mentions were actually
  // created, i.e. that were not mentioned in the message previously.
  async createMessageMentions(
    messageID: UUID,
    userIDs: UUID[],
  ): Promise<UUID[]> {
    if (userIDs.length === 0) {
      return [];
    }

    // we used to use sequelize's bulkCreate() here, but it does not behave as
    // expected. See for example:
    // https://github.com/sequelize/sequelize/issues/11204
    const [returnedColumns] = await getSequelize().query(
      `INSERT INTO
      "${MessageMentionEntity.tableName}"
      ("userID", "messageID")
      VALUES
      ${userIDs.map(() => '(?)').join(',')}
      ON CONFLICT DO NOTHING
      RETURNING "userID"`,
      {
        replacements: userIDs.map((userID) => [userID, messageID]),
      },
    );

    const newUserIDs = (returnedColumns as { userID: UUID }[]).map(
      (row) => row.userID,
    );

    return newUserIDs;
  }

  async deleteExcludingUsers(messageID: UUID, excludedUsers: UUID[]) {
    const where: WhereOptions<MessageMentionEntity> = { messageID };

    if (excludedUsers.length > 0) {
      where.userID = { [Op.notIn]: excludedUsers };
    }

    await MessageMentionEntity.destroy({ where });
  }
}
