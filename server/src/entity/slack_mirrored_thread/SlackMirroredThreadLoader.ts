import { Op } from 'sequelize';

import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import {
  assertViewerHasOrg,
  assertViewerHasOrgs,
} from 'server/src/auth/index.ts';
import { SlackMirroredThreadEntity } from 'server/src/entity/slack_mirrored_thread/SlackMirroredThreadEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';

export class SlackMirroredThreadLoader {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async loadFromThreadID(
    threadID: UUID,
  ): Promise<SlackMirroredThreadEntity | null> {
    const orgIDs = assertViewerHasOrgs(this.viewer);
    return await SlackMirroredThreadEntity.findOne({
      where: {
        threadID,
        [Op.or]: { slackOrgID: orgIDs, threadOrgID: orgIDs },
      },
    });
  }

  async loadFromSlackID(
    slackChannelID: string,
    slackMessageTimestamp: string,
  ): Promise<SlackMirroredThreadEntity | null> {
    const orgID = assertViewerHasOrg(this.viewer);

    return await SlackMirroredThreadEntity.findOne({
      where: {
        slackChannelID,
        slackMessageTimestamp,
        [Op.or]: { slackOrgID: orgID, threadOrgID: orgID },
      },
    });
  }

  async threadIsMirrored(threadID: UUID) {
    // Super lightweight check whether the threadID is already present in the
    // table. (No need to construct SlackMirroredThreadEntity objects just to
    // find out if there is one.)
    const [rows] = await getSequelize().query(
      `SELECT 1 FROM slack_mirrored_threads WHERE "threadID"=$1 LIMIT 1;`,
      {
        bind: [threadID],
      },
    );

    return rows.length > 0;
  }
}
