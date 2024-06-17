import { Table, Column, PrimaryKey, Model } from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';
import type { FileUploadStatus } from 'server/src/schema/resolverTypes.ts';
import {
  getSignedDeleteURL,
  getSignedDownloadURL,
  getSignedUploadURL,
} from 'server/src/files/upload.ts';
import { S3BucketLoader } from 'server/src/entity/s3_bucket/S3BucketLoader.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { API_ORIGIN } from 'common/const/Urls.ts';
import { encodeFileProxyToken } from 'server/src/files/download.ts';

@Table({
  tableName: 'files',
  timestamps: false,
})
export class FileEntity extends Model<
  InferAttributes<FileEntity>,
  InferCreationAttributes<FileEntity>
> {
  @PrimaryKey
  @Column({
    defaultValue: DataTypes.UUIDV4,
    type: DataTypes.UUID,
  })
  id!: UUID;

  @Column({
    type: DataTypes.UUID,
  })
  userID!: UUID; // the user who created this file

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
  })
  platformApplicationID!: UUID;

  @Column({
    type: DataTypes.STRING,
  })
  name!: string;

  @Column({
    type: DataTypes.STRING,
  })
  mimeType!: string;

  @Column({
    type: DataTypes.INTEGER,
  })
  size!: number;

  @Column({
    type: DataTypes.TIME,
  })
  timestamp!: CreationOptional<Date>;

  @Column({
    type: DataTypes.STRING,
  })
  uploadStatus!: FileUploadStatus;

  @Column({
    type: DataTypes.UUID,
  })
  s3Bucket!: UUID | null;

  // URL that points to S3, expires after 24 hours
  async getSignedDownloadURL(
    s3BucketLoader: S3BucketLoader = new S3BucketLoader(
      Viewer.createAnonymousViewer(),
    ),
  ): Promise<string> {
    const s3Bucket = this.s3Bucket
      ? await s3BucketLoader.load(this.s3Bucket)
      : undefined;
    return getSignedDownloadURL(
      this.id,
      this.name,
      s3Bucket?.getS3BucketConfig_DO_NOT_EXPOSE_TO_CLIENT(),
    );
  }

  // URL that points to our FileProxyHandler, never expires
  getPermanentDownloadURL() {
    return `${API_ORIGIN}/file?token=${encodeURIComponent(
      encodeFileProxyToken({
        id: this.id,
      }),
    )}`;
  }

  async getSignedUploadURL(
    s3BucketLoader: S3BucketLoader = new S3BucketLoader(
      Viewer.createAnonymousViewer(),
    ),
  ): Promise<string> {
    const s3Bucket = this.s3Bucket
      ? await s3BucketLoader.load(this.s3Bucket)
      : undefined;
    return getSignedUploadURL(
      this.id,
      this.size,
      this.mimeType,
      s3Bucket?.getS3BucketConfig_DO_NOT_EXPOSE_TO_CLIENT(),
    );
  }

  async getDeleteURL(
    s3BucketLoader: S3BucketLoader = new S3BucketLoader(
      Viewer.createAnonymousViewer(),
    ),
  ): Promise<string> {
    const s3Bucket = this.s3Bucket
      ? await s3BucketLoader.load(this.s3Bucket)
      : undefined;
    return getSignedDeleteURL(
      this.id,
      s3Bucket?.getS3BucketConfig_DO_NOT_EXPOSE_TO_CLIENT(),
    );
  }
}
