import { Table, Column, Model } from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'message_mentions',
  timestamps: false,
})
export class MessageMentionEntity extends Model<
  InferAttributes<MessageMentionEntity>,
  InferCreationAttributes<MessageMentionEntity>
> {
  // before deleting or changing this column, please check the codebase for raw
  // SQL statements using it. For example, see
  // https://radical.phacility.com/D1158
  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
  })
  userID!: UUID; // the user that is being mentioned

  // before deleting or changing this column, please check the codebase for raw
  // SQL statements using it. For example, see
  // https://radical.phacility.com/D1158
  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
  })
  messageID!: UUID;

  @Column({
    type: DataTypes.TIME,
  })
  timestamp!: CreationOptional<Date>;
}
