import { QueryTypes } from 'sequelize';
import type { Viewer } from 'server/src/auth/index.ts';
import type { UUID } from 'common/types/index.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';

export class MessageMentionLoader {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async loadMentionedUsersForThread(threadID: UUID) {
    return await getSequelize().query(
      `
        SELECT DISTINCT u.* FROM users u
        INNER JOIN message_mentions mm ON (u.id = mm."userID")
        INNER JOIN messages m ON (mm."messageID" = m.id)
        WHERE m."threadID" = $1
      `,
      {
        bind: [threadID],
        type: QueryTypes.SELECT,
        model: UserEntity,
      },
    );
  }
}
