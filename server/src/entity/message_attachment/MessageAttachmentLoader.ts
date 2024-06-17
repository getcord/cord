import { Op, QueryTypes } from 'sequelize';
import DataLoader from 'dataloader';
import type { Viewer } from 'server/src/auth/index.ts';
import {
  assertViewerHasOrg,
  assertViewerHasIdentity,
} from 'server/src/auth/index.ts';
import { MessageAttachmentEntity } from 'server/src/entity/message_attachment/MessageAttachmentEntity.ts';
import type { UUID } from 'common/types/index.ts';
import { MessageAttachmentType } from 'common/types/index.ts';
import {
  inKeyOrder,
  inKeyOrderGroupedCustom,
} from 'server/src/entity/base/util.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { MessageLinkPreviewEntity } from 'server/src/entity/message_link_preview/MessageLinkPreviewEntity.ts';
import { isDefined } from 'common/util/index.ts';

export type MessageAttachment =
  | MessageAttachmentEntity
  | MessageLinkPreviewEntity;
export class MessageAttachmentLoader {
  viewer: Viewer;
  dataloader: DataLoader<UUID, MessageAttachmentEntity | null>;
  dataloaderForMessage: DataLoader<
    UUID,
    (MessageAttachmentEntity | MessageLinkPreviewEntity)[]
  >;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.dataloader = new DataLoader(
      async (keys) => {
        assertViewerHasIdentity(this.viewer);

        const attachments = await MessageAttachmentEntity.findAll({
          where: {
            id: keys as UUID[],
          },
        });

        return inKeyOrder(attachments, keys);
      },
      { cache: false },
    );

    this.dataloaderForMessage = new DataLoader(
      async (keys) => {
        const [messageAttachments, messageLinkPreviews] = await Promise.all([
          MessageAttachmentEntity.findAll({
            where: { messageID: keys },
          }),
          MessageLinkPreviewEntity.findAll({
            where: { messageID: keys, hidden: { [Op.ne]: true } },
          }),
        ]);
        return inKeyOrderGroupedCustom(
          [...messageAttachments, ...messageLinkPreviews],
          keys,
          (a) => a.messageID,
        );
      },
      { cache: false },
    );
  }

  async loadAttachmentsForMessage(
    messageID: UUID,
  ): Promise<MessageAttachment[]> {
    return await this.dataloaderForMessage.load(messageID);
  }

  async loadThreadHasAnnotations(threadID: UUID): Promise<boolean> {
    const orgID = assertViewerHasOrg(this.viewer);
    const [{ count }] = await getSequelize().query<{ count: number }>(
      `SELECT COUNT(*) as count
      FROM message_attachments ma
      INNER JOIN messages m ON ma."messageID" = m."id"
      WHERE
        m."threadID" = $1
        AND m."orgID" = $2
        AND ma.type = $3
      `,
      {
        bind: [threadID, orgID, MessageAttachmentType.ANNOTATION],
        type: QueryTypes.SELECT,
      },
    );
    return count > 0;
  }

  // Pass includeDeleted=true if you want to include annotations that belong to
  // messages that have been deleted. This is useful for FloatingThreads in
  // which user might delete the first message of a thread but we still want to
  // return the annotation to show the floating pin. Annotations from threads
  // with all messages deleted are not returned.
  async loadAnnotationAttachmentsOnPage(
    pageContextHash: UUID,
    includeDeleted: boolean,
  ) {
    const orgID = assertViewerHasOrg(this.viewer);

    const threadIsNonEmpty = `AND EXISTS (
          SELECT 1 FROM messages WHERE "deletedTimestamp" IS NULL
          AND type = 'user_message'
          AND "orgID" = $2
          AND "threadID" = t.id
        )`;
    const messageIsNotDeleted = `AND m."deletedTimestamp" IS NULL`;

    return await getSequelize().query(
      `SELECT ma.*
       FROM message_attachments ma
       INNER JOIN messages m ON ma."messageID" = m."id"
       INNER JOIN threads t ON m."threadID" = t."id"
       WHERE
          t."pageContextHash" = $1
          AND t."orgID"= $2
          AND t."resolvedTimestamp" IS NULL
          AND ma.type = $3
          ${includeDeleted ? threadIsNonEmpty : messageIsNotDeleted}
      `,
      {
        bind: [pageContextHash, orgID, MessageAttachmentType.ANNOTATION],
        type: QueryTypes.SELECT,
        model: MessageAttachmentEntity,
      },
    );
  }

  async loadAttachment(id: UUID) {
    try {
      return await this.dataloader.load(id);
    } catch (e) {
      anonymousLogger().logException('Msg attachment dataloader error', e);
      return null;
    }
  }

  async getAttachmentFromFileID(fileID: string) {
    return await MessageAttachmentEntity.findOne({
      where: {
        [Op.or]: [{ data: { fileID } }, { data: { screenshotFileID: fileID } }],
      },
    });
  }
}

export function getFileAttachmentEntities(
  attachments: MessageAttachment[],
): MessageAttachmentEntity[] {
  return attachments.map((a) => ('type' in a ? a : null)).filter(isDefined);
}
