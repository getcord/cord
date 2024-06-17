import DataLoader from 'dataloader';
import { Op } from 'sequelize';
import type { Viewer } from 'server/src/auth/index.ts';
import { MessageLinkPreviewEntity } from 'server/src/entity/message_link_preview/MessageLinkPreviewEntity.ts';
import type { UUID } from 'common/types/index.ts';
import {
  inKeyOrder,
  inKeyOrderGroupedCustom,
} from 'server/src/entity/base/util.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';

export class MessageLinkPreviewLoader {
  viewer: Viewer;
  dataloader: DataLoader<UUID, MessageLinkPreviewEntity | null>;
  dataloaderForMessage: DataLoader<UUID, MessageLinkPreviewEntity[]>;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.dataloader = new DataLoader(
      async (keys) => {
        const linkPreviews = await MessageLinkPreviewEntity.findAll({
          where: {
            id: keys as UUID[],
          },
        });

        return inKeyOrder(linkPreviews, keys);
      },
      { cache: false },
    );

    this.dataloaderForMessage = new DataLoader(
      async (keys) => {
        const linkPreviews = await MessageLinkPreviewEntity.findAll({
          where: { messageID: keys, hidden: { [Op.ne]: true } },
        });
        return inKeyOrderGroupedCustom(linkPreviews, keys, (a) => a.messageID);
      },
      { cache: false },
    );
  }

  async loadLinkPreviewsForMessage(
    messageID: UUID,
  ): Promise<MessageLinkPreviewEntity[]> {
    return await this.dataloaderForMessage.load(messageID);
  }

  async loadLinkPreview(id: UUID) {
    try {
      return await this.dataloader.load(id);
    } catch (e) {
      anonymousLogger().logException('Msg link preview dataloader error', e);
      return null;
    }
  }
}
