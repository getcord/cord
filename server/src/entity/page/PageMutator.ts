import type { Transaction } from 'sequelize';
import type { PageContext } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import {
  assertViewerHasOrg,
  assertViewerHasSingleOrgForWrite,
} from 'server/src/auth/index.ts';
import { getPageContextHash } from 'server/src/util/hash.ts';
import { PageEntity } from 'server/src/entity/page/PageEntity.ts';

export class PageMutator {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async createPageIfNotExists(pageContext: PageContext) {
    const orgID = assertViewerHasOrg(this.viewer);

    const [contextHash, contextData] = getPageContextHash(pageContext);

    // ignoreDuplicates seems to be only supported for bulkCreate
    await PageEntity.bulkCreate(
      [
        {
          orgID,
          contextHash,
          contextData,
        },
      ],
      {
        ignoreDuplicates: true,
      },
    );

    return contextHash;
  }

  async getPageCreateIfNotExists(
    pageContext: PageContext,
    transaction: Transaction,
  ) {
    const orgID = assertViewerHasSingleOrgForWrite(
      this.viewer,
      'Must specify a groupID when creating a new location',
    );
    const [contextHash, contextData] = getPageContextHash(pageContext);
    const [pageEntity] = await PageEntity.findOrCreate({
      where: {
        orgID,
        contextHash,
      },
      defaults: {
        orgID,
        contextHash,
        contextData,
      },
      transaction,
    });
    return { page: pageEntity, pageContextHash: contextHash };
  }
}
