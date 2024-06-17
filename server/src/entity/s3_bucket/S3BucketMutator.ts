import * as crypto from 'crypto';
import env from 'server/src/config/Env.ts';
import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { S3BucketEntity } from 'server/src/entity/s3_bucket/S3BucketEntity.ts';
import type { S3BucketConfigWithCredentials } from 'server/src/files/upload.ts';

export class S3BucketMutator {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async createS3Bucket(
    fields: S3BucketConfigWithCredentials,
  ): Promise<S3BucketEntity> {
    const encryptedSecret = encrypt(fields.accessKeySecret);
    return await S3BucketEntity.create({
      name: fields.bucket,
      region: fields.region,
      accessKeyID: fields.accessKeyID,
      accessKeySecret: encryptedSecret,
    });
  }

  async updateAccessKeySecret(
    id: UUID,
    keyID: string,
    keySecret: string,
  ): Promise<boolean> {
    const encryptedSecret = encrypt(keySecret);
    const [updated] = await S3BucketEntity.update(
      { accessKeySecret: encryptedSecret, accessKeyID: keyID },
      { where: { id } },
    );

    return updated === 1;
  }
}

function encrypt(secret: string) {
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    env.PLATFORM_SECRETS_ENCRYPTION_KEY,
    iv,
  );

  const encrypted = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    encrypted.toString('hex'),
    authTag.toString('hex'),
    iv.toString('hex'),
  ].join(':');
}
