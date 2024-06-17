import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'application_webhooks',
  timestamps: false,
})
export class ApplicationWebhookEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  })
  id!: UUID;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    unique: 'AppURLUniqueness',
  })
  platformApplicationID!: UUID;

  @Column({
    type: DataTypes.STRING,
    allowNull: false,
    unique: 'AppURLUniqueness',
  })
  eventWebhookURL!: string;

  @Column({
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: null,
  })
  eventWebhookSubscriptions!: string[] | null;
}
