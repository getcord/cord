import { QueryTypes } from 'sequelize';

import {
  CORD_AUTOMATED_TESTS_APPLICATION_ID,
  CORD_DOCS_SAMPLE_TOKEN_APPLICATION_ID,
} from 'common/const/Ids.ts';
import type { EmptyJsonObject } from 'common/types/index.ts';
import { AsyncTierJobDefinition } from 'server/src/asyncTier/jobDefinition.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import type { Logger } from 'server/src/logging/Logger.ts';

export default new AsyncTierJobDefinition(
  'wipeTemporaryTokensData',
  wipeTemporaryTokensData,
).schedule({
  tier: 'staging',
  name: 'daily',
  cron: '0 0 * * *',
  data: {},
});

const MAX_ORGS_PER_ITERATION = 100;

/**
 * This job clears out 'sampletoken' and 'demo' applications which have been
 * inactive for more than 24h (demo) or 1w (sampletoken), as well as orgs in the
 * docs live components app and automated tests app.  We used to have a separate
 * job to clear out messages in 'sample' (self-serve) apps too but we decided to
 * stop doing that (PR 7518).
 */
async function wipeTemporaryTokensData(_: EmptyJsonObject, logger: Logger) {
  for (let iteration = 1; await jobIteration(logger, iteration); ++iteration) {
    // Empty, work all done in loop condition.
  }
}

async function jobIteration(
  logger: Logger,
  iteration: number,
): Promise<boolean> {
  const sequelize = getSequelize();
  logger.info(`Starting iteration #${iteration}`);

  return await sequelize.transaction(async (transaction) => {
    const query = (sql: string, bind?: any[]) =>
      sequelize.query(sql, { bind, transaction, type: QueryTypes.RAW });

    await query(
      `CREATE TEMPORARY TABLE inactive_org_ids (
        id uuid NOT NULL
      ) ON COMMIT DROP;`,
    );

    await query(
      `INSERT INTO inactive_org_ids (id)
      -- Docs live component orgs
      SELECT o.id
        FROM cord.orgs o
        LEFT OUTER JOIN cord.page_visitors pv ON pv."orgID"=o.id
        WHERE o."platformApplicationID"=$1
        AND NOW() - o."createdTimestamp" > '24 hours'
        GROUP BY o.id
        HAVING COALESCE(NOW() - MAX(pv."lastPresentTimestamp") > '24 hours', true)
      -- Demo token apps (canvas app etc on docs.cord.com and cord.com homepage)
        UNION SELECT o.id
          FROM cord.orgs o
          INNER JOIN cord.applications a ON a.id=o."platformApplicationID"
          LEFT OUTER JOIN cord.page_visitors pv ON pv."orgID"=o.id
          WHERE a.environment='demo'
          AND NOW() - o."createdTimestamp" > '24 hours'
          GROUP BY o.id
          HAVING COALESCE(NOW() - MAX(pv."lastPresentTimestamp") > '24 hours', true)  
      -- Sample token apps (integration guide/opensource demo app repos)
      UNION SELECT o.id
        FROM cord.orgs o
        INNER JOIN cord.applications a ON a.id=o."platformApplicationID"
        LEFT OUTER JOIN cord.page_visitors pv ON pv."orgID"=o.id
        WHERE a.environment='sampletoken'
        AND NOW() - o."createdTimestamp" > '1 week'
        GROUP BY o.id
        HAVING COALESCE(NOW() - MAX(pv."lastPresentTimestamp") > '1 week', true)
      -- Automated test app orgs
      UNION SELECT o.id
        FROM cord.orgs o
        WHERE o."platformApplicationID" = $2
        AND NOW() - o."createdTimestamp" > '1 hour'
      -- The following limit applies to the whole of this query
      LIMIT $3;`,
      [
        CORD_DOCS_SAMPLE_TOKEN_APPLICATION_ID,
        CORD_AUTOMATED_TESTS_APPLICATION_ID,
        MAX_ORGS_PER_ITERATION,
      ],
    );

    const [{ orgCount }] = await sequelize.query<{ orgCount: number }>(
      `SELECT COUNT(*) AS "orgCount" FROM inactive_org_ids;`,
      { type: QueryTypes.SELECT, transaction },
    );

    if (orgCount === 0) {
      logger.info(`No orgs found to delete in iteration #${iteration}`, {
        orgCount,
        iteration,
      });
      return false;
    }

    logger.info(`Identified ${orgCount} orgs to delete`, {
      orgCount,
      iteration,
    });

    // Determine application ids to be removed
    await query(
      `CREATE TEMPORARY TABLE inactive_app_ids (
        id uuid NOT NULL
      ) ON COMMIT DROP;`,
    );

    await query(`
      INSERT INTO inactive_app_ids (id)
      -- sampletoken apps
      SELECT a.id
        FROM cord.applications a
        LEFT OUTER JOIN orgs o ON o."platformApplicationID"=a.id
        LEFT OUTER JOIN inactive_org_ids ON o.id=inactive_org_ids.id
        WHERE a.environment='sampletoken'
        AND a."createdTimestamp" < NOW() - '1 week'::interval
        GROUP BY a.id
        HAVING COUNT(o)=COUNT(inactive_org_ids)
      -- demo apps
      UNION SELECT a.id
        FROM cord.applications a
        LEFT OUTER JOIN orgs o ON o."platformApplicationID"=a.id
        LEFT OUTER JOIN inactive_org_ids ON o.id=inactive_org_ids.id
        WHERE a.environment='demo'
        AND a."createdTimestamp" < NOW() - '24 hours'::interval
        GROUP BY a.id
        HAVING COUNT(o)=COUNT(inactive_org_ids);
        `);

    // Determine the users to be removed
    await query(
      `CREATE TEMPORARY TABLE inactive_user_ids ON COMMIT DROP AS
      -- users that are members only in inactive orgs
      SELECT m."userID" AS id
        FROM org_members m LEFT OUTER JOIN inactive_org_ids ON m."orgID"=inactive_org_ids.id
        GROUP BY m."userID"
        HAVING COUNT(m)=COUNT(inactive_org_ids)
      -- users of an application to-be-removed who is not a member of any org (we need to
      -- delete those in order to delete the apps, and these are not caught by the
      -- previous branch)
      UNION SELECT u.id
        FROM users u
        INNER JOIN inactive_app_ids ON u."platformApplicationID"=inactive_app_ids.id
        WHERE NOT EXISTS (
          SELECT 1 FROM cord.org_members om WHERE om."userID"=u.id
        );`,
    );

    // Delete inactive users, orgs, and related entities
    await query(
      `DELETE FROM cord.message_notifications
        USING inactive_org_ids, cord.org_members
        WHERE "targetUserID"=org_members."userID" AND org_members."orgID"=inactive_org_ids.id;`,
    );

    await query(
      `DELETE FROM cord.linked_orgs
        USING inactive_org_ids
        WHERE "sourceOrgID"=inactive_org_ids.id
        OR "linkedOrgID"=inactive_org_ids.id;`,
    );

    await query(
      `DELETE FROM cord.linked_users
        USING inactive_org_ids
        WHERE "sourceOrgID"=inactive_org_ids.id
        OR "linkedOrgID"=inactive_org_ids.id;`,
    );

    await query(
      `DELETE FROM cord.org_members
        USING inactive_org_ids
        WHERE "orgID"=inactive_org_ids.id;`,
    );

    await query(
      `DELETE FROM cord.messages
        USING inactive_org_ids
        WHERE "orgID"=inactive_org_ids.id;`,
    );

    await query(
      `DELETE FROM cord.threads
        USING inactive_org_ids
        WHERE "orgID"=inactive_org_ids.id;`,
    );

    await query(
      `DELETE FROM cord.pages
        USING inactive_org_ids
        WHERE "orgID"=inactive_org_ids.id;`,
    );

    await query(
      `DELETE FROM cord.users
        USING inactive_user_ids
        WHERE cord.users.id=inactive_user_ids.id;`,
    );

    await query(
      `DELETE FROM cord.orgs
        USING inactive_org_ids
        WHERE orgs.id=inactive_org_ids.id;`,
    );

    await query(
      `DELETE FROM cord.applications
        USING inactive_app_ids
        WHERE applications.id=inactive_app_ids.id;`,
    );

    const needAnotherIteration = orgCount >= MAX_ORGS_PER_ITERATION;
    logger.info(`Completed iteration #${iteration}`, {
      iteration,
      orgCount,
      needAnotherIteration,
    });
    return needAnotherIteration;
  });
}
