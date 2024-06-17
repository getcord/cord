import { QueryTypes } from 'sequelize';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

type CountQueryRow = { count: string };

export const applicationDeploymentInfoResolver: Resolvers['ApplicationDeploymentInfo'] =
  {
    messages: async (application) => {
      const result = await getSequelize().query<CountQueryRow>(
        `SELECT COUNT(*)
          FROM messages m
          INNER JOIN orgs o ON m."orgID" = o.id
          WHERE o."platformApplicationID" = $1
            AND m.timestamp > NOW() - '1 week'::interval`,
        { bind: [application.id], type: QueryTypes.SELECT },
      );

      return parseInt(result[0].count, 10);
    },
    users: async (application) => {
      const result = await getSequelize().query<CountQueryRow>(
        `SELECT COUNT(DISTINCT pv."userID")
          FROM page_visitors pv
          INNER JOIN orgs o ON pv."orgID" = o.id
          WHERE o."platformApplicationID" = $1
            AND pv."lastPresentTimestamp" > NOW() - '1 week'::interval`,
        { bind: [application.id], type: QueryTypes.SELECT },
      );

      return parseInt(result[0].count, 10);
    },
    usersSyncedAllTime: async (application) => {
      const result = await getSequelize().query<CountQueryRow>(
        `SELECT COUNT(id)
          FROM users
          WHERE "platformApplicationID" = $1`,
        { bind: [application.id], type: QueryTypes.SELECT },
      );

      return parseInt(result[0].count, 10);
    },
    orgs: async (application) => {
      const result = await getSequelize().query<CountQueryRow>(
        `SELECT COUNT(DISTINCT o.id)
          FROM page_visitors pv
          INNER JOIN orgs o ON pv."orgID" = o.id
          WHERE o."platformApplicationID" = $1
            AND pv."lastPresentTimestamp" > NOW() - '1 week'::interval`,
        { bind: [application.id], type: QueryTypes.SELECT },
      );

      return parseInt(result[0].count, 10);
    },
    orgsSyncedAllTime: async (application) => {
      const result = await getSequelize().query<CountQueryRow>(
        `SELECT COUNT(id)
          FROM orgs
          WHERE "platformApplicationID" = $1`,
        { bind: [application.id], type: QueryTypes.SELECT },
      );

      return parseInt(result[0].count, 10);
    },
    components: async (application) => {
      const result = await getSequelize().query<{ component: string }>(
        `SELECT DISTINCT component
          FROM events e, jsonb_array_elements_text(e.payload->'components') as component
          WHERE e.type = 'sdk-components-used'
            AND e."platformApplicationID" = $1
            AND e."serverTimestamp" > NOW() - '1 week'::interval`,
        { bind: [application.id], type: QueryTypes.SELECT },
      );

      return result.map((c) => c.component.toLowerCase()).sort();
    },
    componentsInitializedAllTime: async (application) => {
      const result = await getSequelize().query<{ component: string }>(
        `SELECT DISTINCT component
          FROM events e, jsonb_array_elements_text(e.payload->'components') as component
          WHERE e.type = 'sdk-components-used'
            AND e."platformApplicationID" = $1`,
        { bind: [application.id], type: QueryTypes.SELECT },
      );

      return result.map((c) => c.component.toLowerCase()).sort();
    },
    reactPackageVersion: async (application) => {
      const results = await getSequelize().query<{
        reactPackageVersion: string;
      }>(
        `SELECT DISTINCT payload->>'reactPackageVersion' as "reactPackageVersion"
          FROM events e
          WHERE e.type = 'sdk-init'
            AND jsonb_typeof(payload->'reactPackageVersion') = 'string'
            AND e.payload->>'appID' = $1
            AND e."serverTimestamp" > NOW() - '1 day'::interval
         `,
        {
          bind: [application.id],
          type: QueryTypes.SELECT,
        },
      );

      return results.map((result) => result.reactPackageVersion);
    },
    customLocations: async (application) => {
      const result = await getSequelize().query<CountQueryRow>(
        `SELECT COUNT(DISTINCT p."contextData")
          FROM page_visitors pv
          INNER JOIN orgs o ON pv."orgID" = o.id
          INNER JOIN pages p ON pv."pageContextHash" = p."contextHash"
            AND pv."orgID" = p."orgID"
          WHERE o."platformApplicationID" = $1
            AND pv."lastPresentTimestamp" > NOW() - '1 week'::interval
            AND p."providerID" IS NULL
            AND p."contextData" - 'location' != '{}'`,
        { bind: [application.id], type: QueryTypes.SELECT },
      );

      return parseInt(result[0].count, 10);
    },
    customLocationsAllTime: async (application) => {
      const result = await getSequelize().query<CountQueryRow>(
        `SELECT COUNT(DISTINCT p."contextData")
          FROM pages p
          INNER JOIN orgs o ON p."orgID" = o.id
          AND p."orgID" = o.id
          WHERE o."platformApplicationID" = $1
            AND p."providerID" IS NULL`,
        { bind: [application.id], type: QueryTypes.SELECT },
      );

      return parseInt(result[0].count, 10);
    },
    browsers: async (application) => {
      return (
        await getSequelize().query<{ key: string; count: string }>(
          // SELECT DISTINCT ON selects a single row per user, so this gives the
          // proportion by user, not by session or anything else.  If a user has
          // multiple records, we use the most recent one, so a user that uses
          // multiple browsers/OSes will get counted as just using one
          `SELECT payload->>'browserName' AS key, COUNT(*) AS count
          FROM (SELECT DISTINCT ON ("userID") payload
              FROM cord.events e
              WHERE e.type = 'sdk-client-info'
                AND e."platformApplicationID" = $1
                AND e."serverTimestamp" > NOW() - '1 week'::interval
              ORDER BY "userID", "serverTimestamp" DESC) AS e
          GROUP BY key
          ORDER BY count`,
          { bind: [application.id], type: QueryTypes.SELECT },
        )
      ).map(({ key, count }) => ({ key, count: parseInt(count, 10) }));
    },
    operatingSystems: async (application) => {
      return (
        await getSequelize().query<{ key: string; count: string }>(
          // SELECT DISTINCT ON selects a single row per user, so this gives the
          // proportion by user, not by session or anything else.  If a user has
          // multiple records, we use the most recent one, so a user that uses
          // multiple browsers/OSes will get counted as just using one
          `SELECT payload->>'osName' AS key, COUNT(*) AS count
          FROM (SELECT DISTINCT ON ("userID") payload
              FROM cord.events e
              WHERE e.type = 'sdk-client-info'
                AND e."platformApplicationID" = $1
                AND e."serverTimestamp" > NOW() - '1 week'::interval
              ORDER BY "userID", "serverTimestamp" DESC) AS e
          GROUP BY key
          ORDER BY count`,
          { bind: [application.id], type: QueryTypes.SELECT },
        )
      ).map(({ key, count }) => ({ key, count: parseInt(count, 10) }));
    },
  };
