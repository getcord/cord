import type { Attributes } from 'sequelize';
import { QueryTypes } from 'sequelize';

import DataLoader from 'dataloader';
import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasOrg } from 'server/src/auth/index.ts';
import { PageEntity } from 'server/src/entity/page/PageEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { inKeyOrderOrNullCustom } from 'server/src/entity/base/util.ts';

export class PageLoader {
  private primaryPageForThreadDataloader: DataLoader<UUID, PageEntity | null>;

  constructor(private viewer: Viewer) {
    this.primaryPageForThreadDataloader = new DataLoader(
      async (keys) => {
        const rows = await getSequelize().query<
          { threadID: UUID } & Attributes<PageEntity>
        >(
          `SELECT t.id as "threadID", p.* FROM pages p, threads t
         WHERE p."orgID" = t."orgID"
          AND p."contextHash" = t."pageContextHash"
          AND t.id = ANY($1);`,
          {
            bind: [keys],
            type: QueryTypes.SELECT,
          },
        );
        return inKeyOrderOrNullCustom(rows, keys, (r) => r.threadID).map(
          (r) => r && PageEntity.build(r),
        );
      },
      { cache: false },
    );
  }

  async getPageFromContextHash(contextHash: UUID, orgOverride?: UUID) {
    const orgID = assertViewerHasOrg(this.viewer);

    return await PageEntity.findOne({
      where: {
        contextHash,
        orgID: orgOverride ?? orgID,
      },
    });
  }

  async loadPrimaryPageForThreadNoOrgCheck(threadID: UUID) {
    return await this.primaryPageForThreadDataloader.load(threadID);
  }
}
