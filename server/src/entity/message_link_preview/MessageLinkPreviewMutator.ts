import type { Transaction } from 'sequelize';
import type { UUID } from 'common/types/index.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import type { RequestContextLoaders } from 'server/src/RequestContextLoaders.ts';
import { MessageLinkPreviewEntity } from 'server/src/entity/message_link_preview/MessageLinkPreviewEntity.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';

export interface MessageLinkPreviewUpsertArgs {
  messageID: UUID;
  url: string;
  title: string | null;
  description: string | null;
  img: string | null;
}

export class MessageLinkPreviewMutator {
  constructor(
    private viewer: Viewer,
    private loaders: RequestContextLoaders | null,
  ) {}

  async upsert(
    args: MessageLinkPreviewUpsertArgs,
    transaction?: Transaction,
  ): Promise<MessageLinkPreviewEntity> {
    const { messageID, url, title, description, img } = args;
    const [result, _] = await MessageLinkPreviewEntity.upsert(
      {
        messageID,
        url,
        title,
        description,
        img,
        hidden: false,
      },
      { transaction },
    );
    return result;
  }

  async hide(linkPreviewID: UUID): Promise<boolean> {
    if (!this.loaders) {
      throw new Error('loaders cannot be null for messagLinkPreviewMutator');
    }

    const userID = assertViewerHasUser(this.viewer);

    const linkPreview =
      await this.loaders.messageLinkPreviewLoader.loadLinkPreview(
        linkPreviewID,
      );

    if (!linkPreview) {
      throw new Error('Link preview was not loaded');
    }

    const message = await this.loaders.messageLoader.loadMessage(
      linkPreview?.messageID,
    );

    if (!message) {
      throw new Error('Cannot find message.');
    }

    if (message.sourceID !== userID) {
      throw new Error('Only the message author can edit the link previews');
    }

    const [updated] = await MessageLinkPreviewEntity.update(
      {
        hidden: true,
      },
      {
        where: {
          id: linkPreviewID,
        },
      },
    );

    backgroundPromise(
      publishPubSubEvent(
        'thread-message-updated',
        { threadID: message.threadID },
        { messageID: message.id },
      ),
    );

    return updated > 0;
  }
}
