import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

@Table({
  tableName: 'image_variants',
  timestamps: false,
})
export class ImageVariantEntity extends Model {
  /**
   * sha384 hash of the image this variant is based on
   */
  @Column({
    type: DataTypes.TEXT,
    primaryKey: true,
    allowNull: false,
  })
  sourceSha384!: string;

  /**
   * description of how the base image was altered
   */
  @Column({
    type: DataTypes.TEXT,
    primaryKey: true,
    allowNull: false,
  })
  variant!: string;

  /**
   * time this variant was created
   */
  @Column({
    type: DataTypes.TIME,
    allowNull: false,
  })
  timestamp!: Date;

  /**
   * filename, i.e. key in our public S3 bucket
   */
  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
  })
  filename!: string;
}
