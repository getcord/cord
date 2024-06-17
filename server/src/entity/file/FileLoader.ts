import DataLoader from 'dataloader';
import type { Viewer } from 'server/src/auth/index.ts';
import { FileEntity } from 'server/src/entity/file/FileEntity.ts';
import type { UUID } from 'common/types/index.ts';
import { inKeyOrder } from 'server/src/entity/base/util.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';

export class FileLoader {
  viewer: Viewer;
  dataloader: DataLoader<UUID, FileEntity | null>;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.dataloader = new DataLoader(
      async (keys) => {
        const files = await FileEntity.findAll({
          where: {
            id: keys as UUID[],
          },
        });

        return inKeyOrder(files, keys);
      },
      { cache: false },
    );
  }

  async loadFile(id: UUID) {
    try {
      return await this.dataloader.load(id);
    } catch (e) {
      anonymousLogger().logException('File dataloader error', e);
      return null;
    }
  }

  async loadFiles(fileIDs: UUID[]): Promise<FileEntity[]> {
    const results = await this.dataloader.loadMany(fileIDs);
    return results.filter((x) => !(x instanceof Error)) as FileEntity[];
  }
}
