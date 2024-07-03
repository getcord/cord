import { assertViewerHasUser } from 'server/src/auth/index.ts';
import type { JsonObject } from 'common/types/index.ts';
import { DataTableQueries } from 'common/types/index.ts';
import { CORD_SLACK_TEAM_ID } from 'common/const/Ids.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

const DataTableQueryToSQL: { [query in DataTableQueries]: string } = {
  [DataTableQueries.ADMIN_USERS]: `
    select
    users.id, users.name as user_name, orgs.name as org_name, email, admin
    from users, orgs, org_members
    where users.id = org_members."userID"
    and org_members."orgID" = orgs.id and (admin = true or orgs."externalID" = '${CORD_SLACK_TEAM_ID}')
    order by admin desc;
  `,
  [DataTableQueries.SET_ADMIN]: `
    update users set admin = $admin where id = $id;
  `,
  [DataTableQueries.USER_DETAILS]: `
    SELECT * FROM users WHERE id = $id
  `,
  [DataTableQueries.ORG_DETAILS]: `
    SELECT
      *,
      (SELECT COUNT(1) FROM org_members WHERE "orgID" = $id) AS "memberCount",
      (SELECT array_agg("userID") FROM org_members WHERE "orgID" = $id) AS "memberIDs"
    FROM orgs
    WHERE id = $id
  `,
  [DataTableQueries.APP_DETAILS]: `
    SELECT * FROM applications WHERE id = $id
  `,
  [DataTableQueries.ORG_MEMBER_DETAILS]: `
    SELECT "orgID", name FROM org_members, orgs
    WHERE orgs.id = org_members."orgID" AND org_members."userID" = $id
  `,
  [DataTableQueries.THREAD_DETAILS]: `
    SELECT
      t.*,
      p."contextData" as location,
      (SELECT COUNT(1) FROM messages WHERE "threadID" = $id) AS "messageCount",
      (SELECT array_agg("id") FROM messages WHERE "threadID" = $id ORDER BY "createdTimestamp" DESC) AS "messageIDs"
    FROM threads t
    LEFT OUTER JOIN pages p ON p."orgID" = t."orgID" AND p."contextHash" = t."pageContextHash"
    WHERE id = $id
  `,
  [DataTableQueries.MESSAGE_DETAILS]: `
    SELECT * from messages WHERE id = $id
  `,
  [DataTableQueries.CUSTOMER_DETAILS]: `
    SELECT * FROM customers WHERE id = $id
  `,
  [DataTableQueries.ID_SEARCH]: `
    SELECT
      (SELECT array_agg("id") FROM applications WHERE "id"::text = $id) AS "applicationsInternal",
      (SELECT array_agg("id") FROM orgs WHERE "id"::text = $id) as "orgsInternal",
      (SELECT array_agg("id") FROM orgs WHERE "externalID" = $id) as "orgsExternal",
      (SELECT array_agg("id") FROM users WHERE "id"::text = $id) as "usersInternal",
      (SELECT array_agg("id") FROM users WHERE "externalID" = $id) as "usersExternal",
      (SELECT array_agg("id") FROM threads WHERE "id"::text = $id) as "threadsInternal",
      (SELECT array_agg("id") FROM threads WHERE "externalID" = $id) as "threadsExternal",
      (SELECT array_agg("id") FROM messages WHERE "id"::text = $id) as "messagesInternal",
      (SELECT array_agg("id") FROM messages WHERE "externalID" = $id) as "messagesExternal";
  `,
  [DataTableQueries.PROD_APPLICATIONS]: `
    SELECT applications.id, applications.name, applications."customerID"
    FROM cord.applications
    WHERE applications.environment = 'production'
    GROUP BY applications.id
    ORDER BY applications.name ASC;
  `,
  [DataTableQueries.STAGING_APPLICATIONS]: `
    SELECT applications.id, applications.name, applications."customerID"
    FROM cord.applications
    WHERE applications.environment = 'staging'
    GROUP BY applications.id
    ORDER BY applications.name ASC;
  `,
  [DataTableQueries.SAMPLE_APPLICATIONS]: `
    SELECT applications.id, applications.name, applications."customerID"
    FROM cord.applications
    WHERE applications.environment = 'sample'
    GROUP BY applications.id
    ORDER BY applications.name ASC;
  `,
  [DataTableQueries.VERIFIED_CUSTOMERS]: `
    SELECT customers.id, customers.name, customers."implementationStage", customers."launchDate", customers."pricingTier", customers."billingStatus"
    FROM cord.customers
    WHERE "type" = 'verified'
    ORDER BY customers.name ASC;
  `,
  [DataTableQueries.SAMPLE_CUSTOMERS]: `
    SELECT customers.id, customers.name
    FROM cord.customers
    WHERE "type" = 'sample'
    ORDER BY customers.name ASC;
  `,
  [DataTableQueries.DEPLOYS]: `
    SELECT * FROM cord.deploys ORDER BY "deployStartTime" DESC LIMIT 100;
  `,
  [DataTableQueries.PAGE_CONTEXTS]: `
    SELECT pages."orgID", count(threads.id) as "threads", pages."contextData", pages."contextHash" from orgs, pages
    LEFT JOIN threads ON threads."pageContextHash" = pages."contextHash" AND threads."orgID" = pages."orgID"
    WHERE orgs."platformApplicationID" = $applicationID and orgs.id = pages."orgID"
    GROUP BY pages."orgID", pages."contextHash"
    ORDER BY "threads" DESC;
  `,
  [DataTableQueries.BROWSER_METRICS]: `
    SELECT payload->>'browserName' AS key, COUNT(*) AS count
    FROM (SELECT DISTINCT ON ("userID") payload
        FROM cord.events e
        INNER JOIN cord.applications a ON e."platformApplicationID" = a.id
        WHERE e.type = 'sdk-client-info'
          AND e."serverTimestamp" > NOW() - '1 week'::interval
          AND a.environment = 'production'
        ORDER BY "userID", "serverTimestamp" DESC) AS e
    GROUP BY key
    ORDER BY count
  `,
  [DataTableQueries.OS_METRICS]: `
    SELECT payload->>'osName' AS key, COUNT(*) AS count
    FROM (SELECT DISTINCT ON ("userID") payload
        FROM cord.events e
        INNER JOIN cord.applications a ON e."platformApplicationID" = a.id
        WHERE e.type = 'sdk-client-info'
          AND e."serverTimestamp" > NOW() - '1 week'::interval
          AND a.environment = 'production'
        ORDER BY "userID", "serverTimestamp" DESC) AS e
    GROUP BY key
    ORDER BY count
  `,
  [DataTableQueries.GO_REDIRECTS]: `
    SELECT name, url as destination, "redirectCount" as uses
    FROM admin_go_redirects
    ORDER BY name ASC
    `,
};

export const selectQueryResolver: Resolvers['Query']['select'] = async (
  _,
  args,
  context,
) => {
  const userID = assertViewerHasUser(context.session.viewer);
  const user = await context.loaders.userLoader.loadUser(userID);
  if (!user?.admin) {
    return [];
  }

  const sql = DataTableQueryToSQL[args.query as DataTableQueries] as
    | string
    | undefined;

  if (!sql) {
    throw new Error('Unknown query');
  }

  const [rows] = await context.sequelize.query(sql, {
    bind: args.parameters,
  });
  return rows as JsonObject[];
};
