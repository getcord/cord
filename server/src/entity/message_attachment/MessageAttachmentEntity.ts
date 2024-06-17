import { Table, Column, PrimaryKey, Model } from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { DataTypes } from 'sequelize';
import type {
  Location,
  HighlightedTextConfig,
  UUID,
} from 'common/types/index.ts';
import { MessageAttachmentType } from 'common/types/index.ts';
import type { DocumentLocationInput } from 'server/src/schema/resolverTypes.ts';
import { isDefined } from 'common/util/index.ts';

export type MessageAttachmentData =
  | MessageFileAttachmentData
  | MessageAnnotationAttachmentData
  | MessageScreenshotAttachmentData;

export interface MessageFileAttachmentData {
  fileID: UUID;
}

export interface MessageScreenshotAttachmentData {
  screenshotFileID: UUID | null | undefined;
  blurredScreenshotFileID: UUID | null | undefined;
}

export interface MessageAnnotationAttachmentData {
  screenshotFileID: UUID | null | undefined;
  blurredScreenshotFileID?: UUID | null;
  location: DocumentLocationInput | null | undefined;
  customLocation?: Location | null | undefined;
  customHighlightedTextConfig?: HighlightedTextConfig | null | undefined;
  customLabel?: string | null | undefined;
  coordsRelativeToTarget?: { x: number; y: number } | null | undefined;
}

@Table({
  tableName: 'message_attachments',
  timestamps: false,
})
export class MessageAttachmentEntity extends Model<
  InferAttributes<MessageAttachmentEntity>,
  InferCreationAttributes<MessageAttachmentEntity>
> {
  @PrimaryKey
  @Column({
    defaultValue: DataTypes.UUIDV4,
    type: DataTypes.UUID,
  })
  id!: CreationOptional<UUID>;

  @Column({
    type: DataTypes.UUID,
  })
  messageID!: UUID;

  @Column({
    type: DataTypes.STRING,
  })
  type!: MessageAttachmentType;

  @Column({
    defaultValue: {},
    type: DataTypes.JSONB,
  })
  data!: MessageAttachmentData;

  @Column({
    type: DataTypes.TIME,
  })
  timestamp!: CreationOptional<Date>;

  getFileIDs(): UUID[] {
    switch (this.type) {
      case MessageAttachmentType.FILE:
        return [(this.data as MessageFileAttachmentData).fileID];
      case MessageAttachmentType.ANNOTATION: {
        const data = this.data as MessageAnnotationAttachmentData;
        return [data.blurredScreenshotFileID, data.screenshotFileID].filter(
          isDefined,
        );
      }
      case MessageAttachmentType.SCREENSHOT: {
        const data = this.data as MessageScreenshotAttachmentData;
        return [data.blurredScreenshotFileID, data.screenshotFileID].filter(
          isDefined,
        );
      }
      default:
        return [];
    }
  }
}
