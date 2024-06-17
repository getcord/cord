import { Table, Column, PrimaryKey, Model } from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'message_link_previews',
  timestamps: false,
})
export class MessageLinkPreviewEntity extends Model<
  InferAttributes<MessageLinkPreviewEntity>,
  InferCreationAttributes<MessageLinkPreviewEntity>
> {
  @PrimaryKey
  @Column({
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
  })
  id!: CreationOptional<UUID>;

  @Column({
    type: DataTypes.UUID,
  })
  messageID!: UUID;

  @Column({
    type: DataTypes.TEXT,
  })
  url!: string;

  @Column({
    type: DataTypes.TEXT,
  })
  img!: string | null;

  @Column({
    type: DataTypes.TEXT,
  })
  title!: string | null;

  @Column({
    type: DataTypes.TEXT,
  })
  description!: string | null;

  @Column({
    type: DataTypes.TIME,
  })
  lastScrapedTimestamp!: CreationOptional<Date>;

  @Column({
    type: DataTypes.BOOLEAN,
  })
  hidden!: boolean;
}
