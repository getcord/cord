import { QueryTypes } from 'sequelize';

import type { Location, UUID } from 'common/types/index.ts';
import { locationJson } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasOrgs } from 'server/src/auth/index.ts';
import { PageVisitorEntity } from 'server/src/entity/page_visitor/PageVisitorEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';

export class PageVisitorLoader {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  loadForContextHash(
    pageContextHash: UUID,
    orgOverride?: UUID, // for unified inbox
  ): Promise<PageVisitorEntity[]> {
    const orgIDs = assertViewerHasOrgs(this.viewer);

    return getSequelize().query(
      `SELECT pv.*
       FROM page_visitors pv
       INNER JOIN users u ON u.id=pv."userID"
       WHERE u.state != 'deleted'
       AND pv."pageContextHash"=$1
       AND pv."orgID"=ANY($2);`,
      {
        type: QueryTypes.SELECT,
        bind: [pageContextHash, orgOverride ? [orgOverride] : orgIDs],
        model: PageVisitorEntity,
      },
    );
  }

  async latestForContext(matcher: Location, exactMatch: boolean) {
    const orgIDs = assertViewerHasOrgs(this.viewer);
    const latest = new Map<UUID, { context: Location; timestamp: number }>();
    // This query retrieves one row per user ('DISTINCT ON (pv."userID")'),
    // where that row contains the most recent matching context they were seen
    // on.  There are a number of ways to do this, as described at
    // https://stackoverflow.com/questions/3800551/select-first-row-in-each-group-by-group
    // In general, I thought SELECT DISTINCT ON was the easiest to read and went
    // with that, but other options may have better performance if that becomes
    // a concern.
    const results = await getSequelize().query<{
      contextData: Location;
      externalUserID: string;
      lastPresentTimestamp: Date;
    }>(
      `SELECT DISTINCT ON (pv."userID")
       p."contextData" as "contextData", u."externalID" as "externalUserID", pv."lastPresentTimestamp" as "lastPresentTimestamp"
       FROM pages p INNER JOIN page_visitors pv 
                    ON (p."orgID" = pv."orgID" AND p."contextHash" = pv."pageContextHash")
                    INNER JOIN users u
                    ON (u.id = pv."userID")
       WHERE "contextData" ${exactMatch ? '=' : '@>'} $1::jsonb
         AND p."orgID" = ANY($2)
         AND u.state != 'deleted'
       ORDER BY pv."userID", "lastPresentTimestamp" DESC`,
      {
        bind: [locationJson(matcher), orgIDs],
        type: QueryTypes.SELECT,
      },
    );
    for (const row of results) {
      latest.set(row.externalUserID, {
        context: row.contextData,
        timestamp: row.lastPresentTimestamp.getTime(),
      });
    }
    return latest;
  }
}
