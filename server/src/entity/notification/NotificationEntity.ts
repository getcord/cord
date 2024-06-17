import { Table, Column, Model } from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { literal, DataTypes } from 'sequelize';
import type { NotificationReplyAction } from '@cord-sdk/types';
import type { EntityMetadata, UUID } from 'common/types/index.ts';
import type { NotificationReadStatus } from 'server/src/schema/resolverTypes.ts';
import type { ThreadActionType } from 'server/src/notifications/types/thread_action.ts';

export type NotificationType =
  | 'reply'
  | 'reaction'
  | 'external'
  | 'thread_action';
export type SpecificNotificationEntity<T extends NotificationType> =
  NotificationEntity & { type: T };

/**
 * As with other `Entity`s, NotificationEntity is a layer directly on top of the
 * raw SQL table. The data here is organised as most convenient for the
 * database, not for UI rendering. For example, while we display a bunch of
 * reactions to the same message as a single notification in the UI, each
 * individual reaction has its own row in the DB and thus its own
 * NotificationEntity.
 *
 * @see Notification is the GraphQL type this is massaged into for UI rendering.
 */
@Table({
  tableName: 'notifications',
  timestamps: false,
})
export class NotificationEntity extends Model<
  InferAttributes<NotificationEntity>,
  InferCreationAttributes<NotificationEntity>
> {
  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  })
  id!: CreationOptional<UUID>;

  @Column({ type: DataTypes.UUID })
  platformApplicationID!: UUID;

  @Column({ type: DataTypes.UUID })
  externalID!: CreationOptional<UUID>;

  @Column({ type: DataTypes.UUID, allowNull: false })
  recipientID!: UUID;

  @Column({ type: DataTypes.UUID, allowNull: true })
  senderID!: UUID | null;

  @Column({ type: DataTypes.TEXT, allowNull: true })
  iconUrl!: string | null;

  @Column({
    type: DataTypes.ENUM('reply', 'reaction', 'external', 'thread_action'),
    allowNull: false,
  })
  type!: NotificationType;

  @Column({ type: DataTypes.TEXT, allowNull: true })
  aggregationKey!: string | null;

  @Column({
    type: DataTypes.ENUM('unread', 'read'),
    allowNull: false,
    defaultValue: 'unread',
  })
  readStatus!: CreationOptional<NotificationReadStatus>;

  @Column({
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: literal('CURRENT_TIMESTAMP'),
  })
  createdTimestamp!: CreationOptional<Date>;

  @Column({ type: DataTypes.UUID, allowNull: true })
  messageID!: UUID | null;

  @Column({ type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true })
  replyActions!: NotificationReplyAction[] | null;

  @Column({ type: DataTypes.UUID, allowNull: true })
  reactionID!: UUID | null;

  @Column({ type: DataTypes.UUID, allowNull: true })
  threadID!: UUID | null;

  @Column({ type: DataTypes.ENUM('resolve', 'unresolve'), allowNull: true })
  threadActionType!: ThreadActionType | null;

  @Column({ type: DataTypes.TEXT, allowNull: true })
  externalTemplate!: string | null;

  @Column({ type: DataTypes.TEXT, allowNull: true })
  externalURL!: string | null;

  @Column({ type: DataTypes.TEXT, allowNull: true })
  extraClassnames!: string | null;

  @Column({
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  metadata!: CreationOptional<EntityMetadata>;
}
