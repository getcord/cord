import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasOrg } from 'server/src/auth/index.ts';
import { SlackChannelEntity } from 'server/src/entity/slack_channel/SlackChannelEntity.ts';

export class SlackChannelMutator {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async createOne(
    slackChannelID: string,
    name: string,
    added: boolean,
    archived: boolean,
    users: number,
  ) {
    const orgID = assertViewerHasOrg(this.viewer);

    return await SlackChannelEntity.upsert({
      orgID,
      slackID: slackChannelID,
      name,
      added,
      archived,
      users,
    });
  }

  async setAdded(slackChannelID: string, added: boolean) {
    const orgID = assertViewerHasOrg(this.viewer);

    const [numberUpdated] = await SlackChannelEntity.update(
      {
        added,
      },
      {
        where: { orgID, slackID: slackChannelID },
      },
    );

    return !!numberUpdated;
  }

  async setArchived(slackChannelID: string, archived: boolean) {
    const orgID = assertViewerHasOrg(this.viewer);

    const [numberUpdated] = await SlackChannelEntity.update(
      {
        // Nothing (including bots) can be in an archived channel, so set added
        // to false if we update a channel to archived
        added: archived ? false : undefined,
        archived,
      },
      {
        where: { orgID, slackID: slackChannelID },
      },
    );

    return !!numberUpdated;
  }

  createMany(
    channels: Array<{
      id: string;
      name: string;
      users: number;
      archived: boolean;
    }>,
  ) {
    const orgID = assertViewerHasOrg(this.viewer);

    return SlackChannelEntity.bulkCreate(
      channels.map(({ id, name, users, archived }) => ({
        slackID: id,
        name,
        orgID,
        added: false,
        archived,
        users,
      })),
      { updateOnDuplicate: ['name', 'users', 'archived'] },
    );
  }

  async setName(slackChannelID: string, name: string) {
    const orgID = assertViewerHasOrg(this.viewer);

    const [numberUpdated] = await SlackChannelEntity.update(
      {
        name,
      },
      {
        where: { orgID, slackID: slackChannelID },
      },
    );

    return !!numberUpdated;
  }
}
