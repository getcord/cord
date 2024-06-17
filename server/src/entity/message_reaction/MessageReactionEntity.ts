import { Table, Column, PrimaryKey, Model } from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

// NB: this seems to be something closer to bytes, not unicode characters, and
// many emoji are multiple bytes (some up to like 10+).
export const REACTION_MAX_LENGTH = 127;

@Table({
  tableName: 'message_reactions',
  timestamps: false,
})
export class MessageReactionEntity extends Model<
  InferAttributes<MessageReactionEntity>,
  InferCreationAttributes<MessageReactionEntity>
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
  userID!: UUID;

  @Column({
    type: DataTypes.UUID,
  })
  messageID!: UUID;

  @Column({
    type: DataTypes.TEXT,
    validate: {
      len: [1, REACTION_MAX_LENGTH],
    },
  })
  unicodeReaction!: string;

  @Column({
    type: DataTypes.TIME,
  })
  timestamp!: CreationOptional<Date>;
}
