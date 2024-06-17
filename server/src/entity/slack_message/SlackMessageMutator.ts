import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasOrg } from 'server/src/auth/index.ts';
import { SlackMessageEntity } from 'server/src/entity/slack_message/SlackMessageEntity.ts';

export class SlackMessageMutator {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async unlinkSlackMessage(
    slackChannelID: string,
    slackMessageTimestamp: string,
  ) {
    const slackOrgID = assertViewerHasOrg(this.viewer);

    await SlackMessageEntity.destroy({
      where: { slackChannelID, slackMessageTimestamp, slackOrgID },
    });
  }
}
