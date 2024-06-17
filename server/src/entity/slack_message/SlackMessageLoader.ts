import type { Viewer } from 'server/src/auth/index.ts';
import { LinkedOrgsLoader } from 'server/src/entity/linked_orgs/LinkedOrgsLoader.ts';
import { SlackMessageEntity } from 'server/src/entity/slack_message/SlackMessageEntity.ts';
export class SlackMessageLoader {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async loadSlackMessage(
    slackChannelID: string,
    slackMessageTimestamp: string,
  ): Promise<SlackMessageEntity | null> {
    const orgIDs = await new LinkedOrgsLoader(this.viewer).getOrgIDs();

    return await SlackMessageEntity.findOne({
      where: { slackChannelID, slackMessageTimestamp, sharerOrgID: orgIDs },
    });
  }
}

// QUESTION: Should I be using the dataloader here?
// QUESTION: Is .findOne() the correct solution here?
//      .findAll() returns "multiple", though there should only be one?
//      .findByPk() doesn't seem to be able to take multiple strings i.e. slackChannelID, slackMessageTimestamp...
