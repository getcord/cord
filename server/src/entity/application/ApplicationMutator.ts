import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import type { S3BucketConfigWithCredentials } from 'server/src/files/upload.ts';
import { S3BucketMutator } from 'server/src/entity/s3_bucket/S3BucketMutator.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';

export class ApplicationMutator {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async setS3BucketConfig(
    id: UUID,
    config?: S3BucketConfigWithCredentials,
  ): Promise<boolean> {
    let bucketID = null;
    if (config) {
      const bucket = await new S3BucketMutator(this.viewer).createS3Bucket(
        config,
      );
      bucketID = bucket.id;
    } else {
      bucketID = null;
    }
    const [updated] = await ApplicationEntity.update(
      { customS3Bucket: bucketID },
      { where: { id } },
    );
    return updated === 1;
  }
}
