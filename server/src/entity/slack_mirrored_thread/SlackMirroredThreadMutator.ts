import type { Transaction } from 'sequelize';

import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasOrg } from 'server/src/auth/index.ts';
import { SlackMirroredThreadEntity } from 'server/src/entity/slack_mirrored_thread/SlackMirroredThreadEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { LinkedOrgsLoader } from 'server/src/entity/linked_orgs/LinkedOrgsLoader.ts';

export class SlackMirroredThreadMutator {
  viewer: Viewer;

  /**
   * Mutator for SlackMirroredThread
   * @param viewer SlackOrg Viewer
   */

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async createOne(
    threadID: UUID,
    slackChannelID: string,
    slackMessageTimestamp: string,
    transaction?: Transaction,
  ) {
    const orgID = assertViewerHasOrg(this.viewer);

    return await SlackMirroredThreadEntity.create(
      {
        threadID,
        threadOrgID: orgID,
        slackOrgID: orgID,
        slackChannelID,
        slackMessageTimestamp,
      },
      { transaction },
    );
  }

  /**
   * Unlink a given Slack thread
   *
   * @param slackChannelID
   * @param slackMessageTimestamp
   * @returns an object with threadID and threadOrgID of the unlinked thread, or
   * null if none was unlinked
   */
  async unlinkSlackThread(
    slackChannelID: string,
    slackMessageTimestamp: string,
  ) {
    const slackOrgID = assertViewerHasOrg(this.viewer);

    const [rows] = (await getSequelize().query(
      `DELETE FROM slack_mirrored_threads
         WHERE "slackOrgID"=$1
         AND "slackChannelID"=$2
         AND "slackMessageTimestamp"=$3
         RETURNING "threadID", "threadOrgID";`,
      {
        bind: [slackOrgID, slackChannelID, slackMessageTimestamp],
      },
    )) as [
      Array<{
        threadID: UUID;
        threadOrgID: UUID;
      }>,
      unknown,
    ];

    return rows.length > 0 ? rows[0] : null;
  }

  async unlinkAllThreads(threadOrgID: UUID, slackOrgID: UUID) {
    const orgIDs = await new LinkedOrgsLoader(this.viewer).getOrgIDs();
    if ([threadOrgID, slackOrgID].every((id) => orgIDs.includes(id))) {
      return await SlackMirroredThreadEntity.destroy({
        where: {
          threadOrgID,
          slackOrgID,
        },
      });
    }
    return;
  }
}
