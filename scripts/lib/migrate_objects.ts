import type { Transaction } from 'sequelize';
import { QueryTypes } from 'sequelize';
import type { Location, UUID } from 'common/types/index.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { PageEntity } from 'server/src/entity/page/PageEntity.ts';
import { getPageContextHash } from 'server/src/util/hash.ts';

/**
 * Migrate all page-related objects from the page with sourceContextHash to the
 * page with context data of destContext.  If the destination page doesn't exist
 * yet, it will be created.  This should only be used with providerless pages
 * (eg, pages from the SDK), because it does not support providers.  If you need
 * to migrate provider-based pages, see scripts/rerun-provider-rules.ts.
 */
export async function migrateObjects(
  orgID: UUID,
  sourceContextHash: UUID,
  destContext: Location,
  transaction?: Transaction,
) {
  const [destContextHash, destContextData] = getPageContextHash({
    data: destContext,
    providerID: null,
  });
  // Create page if it doesn't exist
  await PageEntity.bulkCreate(
    [
      {
        orgID,
        contextHash: destContextHash,
        providerID: null,
        contextData: destContextData,
      },
    ],
    {
      ignoreDuplicates: true,
      transaction,
    },
  );

  // If a thread was pinned to:
  // (orgID, sourceContextHash)
  // now it will be pinned to:
  // (orgID, destContextHash)
  //
  // This update assumes that every thread lives only on 1 page at the
  // moment, so if (threadID, sourceContextHash) exists, then (threadID,
  // destContextHash) does not yet exist
  await getSequelize().query(
    `UPDATE threads
       SET "pageContextHash"=$1
       WHERE "orgID"=$2 AND "pageContextHash"=$3;`,
    {
      bind: [destContextHash, orgID, sourceContextHash],
      transaction,
    },
  );
  await getSequelize().query(
    `UPDATE messages
       SET "pageContextHash"=$1
       WHERE "orgID"=$2 AND "pageContextHash"=$3;`,
    {
      bind: [destContextHash, orgID, sourceContextHash],
      transaction,
    },
  );

  // Insert page visitors from old pageContextHash to new one. If
  // pageVisitor already existed on the new contextHash, then just update
  // it's lastPresentTimestamp with the
  // MAX(timestamp on old contextHash, timestamp on new contextHash)
  await getSequelize().query(
    `INSERT INTO page_visitors
        ("pageContextHash", "userID", "orgID", "lastPresentTimestamp")
          SELECT $1, "userID", "orgID", "lastPresentTimestamp"
          FROM page_visitors
          WHERE "pageContextHash"=$2 AND "orgID"=$3
     ON CONFLICT ("pageContextHash", "orgID", "userID")
     DO UPDATE SET "lastPresentTimestamp"=
       GREATEST(EXCLUDED."lastPresentTimestamp", page_visitors."lastPresentTimestamp");`,
    {
      type: QueryTypes.INSERT,
      bind: [destContextHash, sourceContextHash, orgID],
      transaction,
    },
  );

  await getSequelize().query(
    `UPDATE user_hidden_annotations
       SET "pageContextHash"=$1
       WHERE "pageContextHash"=$2 AND "orgID"=$3;`,
    {
      type: QueryTypes.UPDATE,
      bind: [destContextHash, sourceContextHash, orgID],
      transaction,
    },
  );
}
