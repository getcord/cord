import DataLoader from 'dataloader';
import type { Viewer } from 'server/src/auth/index.ts';
import type { UUID } from 'common/types/index.ts';
import { inKeyOrder } from 'server/src/entity/base/util.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';

export class CustomerLoader {
  viewer: Viewer;
  dataloader: DataLoader<UUID, CustomerEntity | null>;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.dataloader = new DataLoader(
      async (keys) => {
        const buckets = await CustomerEntity.findAll({
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
      anonymousLogger().logException('Customer dataloader error', e);
      return null;
    }
  }

  async loadAll() {
    return await CustomerEntity.findAll();
  }
}
