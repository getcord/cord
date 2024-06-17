import DataLoader from 'dataloader';
import type { Viewer } from 'server/src/auth/index.ts';
import { S3BucketEntity } from 'server/src/entity/s3_bucket/S3BucketEntity.ts';
import type { UUID } from 'common/types/index.ts';
import { inKeyOrder } from 'server/src/entity/base/util.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';

export class S3BucketLoader {
  viewer: Viewer;
  dataloader: DataLoader<UUID, S3BucketEntity | null>;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.dataloader = new DataLoader(
      async (keys) => {
        const buckets = await S3BucketEntity.findAll({
          where: {
            id: keys as UUID[],
          },
        });

        return inKeyOrder(buckets, keys);
      },
      { cache: false },
    );
  }

  async load(id: UUID) {
    try {
      return await this.dataloader.load(id);
    } catch (e) {
      anonymousLogger().logException('S3Bucket dataloader error', e);
      return null;
    }
  }

  async loadAll() {
    return await S3BucketEntity.findAll();
  }

  async loadForApplication(
    application: ApplicationEntity,
  ): Promise<S3BucketEntity | null> {
    if (application.customS3Bucket) {
      return await this.load(application.customS3Bucket);
    } else {
      return null;
    }
  }
}
