import type { Transaction } from 'sequelize';
import { Sequelize } from 'sequelize';

import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasIdentity } from 'server/src/auth/index.ts';
import { PageVisitorEntity } from 'server/src/entity/page_visitor/PageVisitorEntity.ts';

export class PageVisitorMutator {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  /**
   * Make the logged in user a visitor of the given page and/or set
   * lastPresentTimestamp to now
   *
   *
   * pageContextHash must refer to an existing page in the current org.
   */
  async markPresentInPage(pageContextHash: UUID, transaction?: Transaction) {
    const { userID, orgID } = assertViewerHasIdentity(this.viewer);

    await PageVisitorEntity.upsert(
      {
        userID,
        orgID,
        pageContextHash,
        lastPresentTimestamp: Sequelize.fn('NOW'),
      },
      { transaction },
    );
  }
}
