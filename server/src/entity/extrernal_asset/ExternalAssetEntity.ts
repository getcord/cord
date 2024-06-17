import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

@Table({
  tableName: 'external_assets',
  timestamps: false,
})
export class ExternalAssetEntity extends Model {
  /**
   * url from where the asset was downloaded
   */
  @Column({
    type: DataTypes.TEXT,
    primaryKey: true,
    allowNull: false,
  })
  url!: string;

  /**
   * time when download happened
   */
  @Column({
    type: DataTypes.TIME,
    allowNull: false,
  })
  downloadTimestamp!: Date;

  /**
   * sha384 hash of the downloaded contents
   */
  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
  })
  sha384!: string;
}
