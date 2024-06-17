import DataLoader from 'dataloader';

import type { Viewer } from 'server/src/auth/index.ts';
import { SlackChannelEntity } from 'server/src/entity/slack_channel/SlackChannelEntity.ts';
import type { UUID } from 'common/types/index.ts';
import { LinkedOrgsLoader } from 'server/src/entity/linked_orgs/LinkedOrgsLoader.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';

export class SlackChannelLoader {
  viewer: Viewer;
  dataloader: DataLoader<string, SlackChannelEntity | null>;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.dataloader = new DataLoader(
      async (keys: readonly string[]) => {
        const orgIDs = await new LinkedOrgsLoader(this.viewer).getOrgIDs();

        const slackChannels = await SlackChannelEntity.findAll({
          where: { slackID: [...keys], orgID: orgIDs },
        });

        const slackChannelById = Object.fromEntries(
          slackChannels.map((entity) => [entity.slackID, entity]),
        );

        const result = keys.map(
          (key) =>
            (slackChannelById[key] as SlackChannelEntity | undefined) || null,
        );
        return result;
      },
      { cache: false },
    );
  }

  async loadSlackChannel(
    slackChannelID: string,
  ): Promise<SlackChannelEntity | null> {
    try {
      return await this.dataloader.load(slackChannelID);
    } catch (e) {
      anonymousLogger().logException('SlackChannel dataloader error', e);
      return null;
    }
  }

  async loadJoinableSlackChannels(orgIDs: UUID[]) {
    return await SlackChannelEntity.findAll({
      where: { orgID: orgIDs, added: false, archived: false },
      order: [['users', 'DESC']],
    });
  }

  async loadJoinedSlackChannels(orgIDs: UUID[]) {
    return await SlackChannelEntity.findAll({
      where: { orgID: orgIDs, added: true, archived: false },
      order: [['users', 'DESC']],
    });
  }
}
