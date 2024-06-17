import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes, Sequelize } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'sessions',
  timestamps: false,
})
export class SessionEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  })
  id!: UUID;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
  })
  applicationID!: UUID;

  @Column({
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: Sequelize.literal('NOW()'),
  })
  issuedAt!: Date;

  @Column({
    type: DataTypes.TIME,
  })
  expiresAt!: Date;
}
