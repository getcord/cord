import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'thread_participants',
  timestamps: false,
})
export class ThreadParticipantEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
  })
  threadID!: UUID;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
  })
  userID!: UUID;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
  })
  orgID!: UUID;

  // The timestamp of the last seen message, or NULL if no messages have been
  // seen
  @Column({
    type: DataTypes.TIME,
  })
  lastSeenTimestamp!: Date | null;

  @Column({
    type: DataTypes.TIME,
  })
  lastUnseenMessageTimestamp!: Date | null;

  @Column({
    type: DataTypes.TIME,
  })
  lastUnseenReactionTimestamp!: Date | null;

  @Column({
    type: DataTypes.BOOLEAN,
    allowNull: false,
  })
  subscribed!: boolean;
}
