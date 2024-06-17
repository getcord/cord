import * as crypto from 'crypto';
import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import env from 'server/src/config/Env.ts';
import type { UUID } from 'common/types/index.ts';
import type { S3BucketConfigWithCredentials } from 'server/src/files/upload.ts';

@Table({
  tableName: 's3_buckets',
  timestamps: false,
})
export class S3BucketEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  })
  id!: UUID;

  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
  })
  region!: string;

  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
  })
  accessKeyID!: string;

  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
  })
  accessKeySecret!: string; // encrypted

  public getS3BucketConfig_DO_NOT_EXPOSE_TO_CLIENT(): S3BucketConfigWithCredentials {
    const [encrypted, authTag, iv] = this.accessKeySecret.split(':');

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      env.PLATFORM_SECRETS_ENCRYPTION_KEY,
      Buffer.from(iv, 'hex'),
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final();

    return {
      bucket: this.name,
      region: this.region,
      accessKeyID: this.accessKeyID,
      accessKeySecret: decrypted,
    };
  }
}
