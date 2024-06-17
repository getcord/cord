import type { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import type { CoreThreadData } from '@cord-sdk/types';

import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import {
  validateFilter,
  validateLimit,
  validatePaginationToken,
} from 'server/src/public/routes/platform/validateQuery.ts';
import { getUsersTyping } from 'server/src/presence/typing.ts';
import { isDefined } from 'common/util/index.ts';
import type { UUID } from 'common/types/index.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';

const DEFAULT_LIMIT = 1000;
export interface ListThreadsPaginationToken {
  externalID: string;
  nextCursorTimestamp: string;
}

function encodeToken(token: ListThreadsPaginationToken): string {
  return btoa(JSON.stringify(token));
}

async function listThreadsHandler(req: Request, res: Response) {
  const results = await listThreads(req);
  return res.status(200).json(results);
}

async function loadTypingUsers(threadIDs: UUID[]) {
  const typingUserByThread = await Promise.all(
    threadIDs.map(
      async (threadID) => [threadID, await getUsersTyping(threadID)] as const,
    ),
  );
  const allUserObjects = await UserEntity.findAll({
    where: { id: [...new Set(typingUserByThread.flatMap((tubt) => tubt[1]))] },
  });
  const usersByID = new Map(allUserObjects.map((u) => [u.id, u.externalID]));
  return new Map(
    typingUserByThread.map((tubt) => [
      tubt[0],
      tubt[1].map((id) => usersByID.get(id)).filter(isDefined),
    ]),
  );
}

export async function listThreads(req: Request) {
  const {
    bindVariables,
    countBindVariables,
    locationFilter,
    filters,
    cursor,
    resultsLimit,
    limitQuery,
  } = await parseThreadsRequest(req);

  /*
This is a single query that fetches all of the data we return for the 
/v1/threads endpoint.  It does this instead of fetching all the ThreadEntities
and then doing a query for Org, Page, Message, and ThreadParticipant each for each thread.
This enables us to gather all data in a single query.

We select all of the threads which belong to the `platformApplicationID`. That is then joined
with the `orgs` table to get the `organizationID` to which the thread belongs.  We similarly join
with the `pages` table to get `location` information.  We join on the `messages` table to get
`count` and also to get the `lastUpdated` time for the thread. The messages table is a LEFT JOIN
because it is possible that a thread exists without any messages in it. We then join with the
messages table again to find the external IDs of the people who replied to the thread. From the
messages table, we sort by timestamp then remove the first message by excluding index 1. This is
done because we don't want to include the author of the first message in the replying user IDs. 
A LEFT JOIN is used for the same reason. The last join is on `thread_participants` to get the 
`participants` and `subscribers` data.
It is again a LEFT JOIN for the same reason above.  The entire query is 
sorted by the `lastUpdated` time we computed so that users can see their most recent threads first.
*/
  const data = await getSequelize().query<
    Omit<CoreThreadData, 'typing' | 'groupID'> & {
      internalID: UUID;
      nextCursorTimestamp: string;
    }
  >(
    `
SELECT
    t.id as "internalID",
    t."externalID" as id,
    o."externalID" as "organizationID",
    COALESCE(mc.count, 0)::INTEGER as total,
    COALESCE(mc.userMessagesCount, 0)::INTEGER as "userMessages",
    COALESCE(mc.actionMessagesCount, 0)::INTEGER as "actionMessages",
    COALESCE(mc.deletedMessagesCount, 0)::INTEGER as "deletedMessages",
    CASE WHEN t."resolvedTimestamp" IS NULL THEN FALSE ELSE TRUE END as resolved,
    t."resolvedTimestamp",
    TO_CHAR(COALESCE(mc."lastCreated", t."createdTimestamp"), 'YYYY-MM-DD HH24:MI:SS.US') as "nextCursorTimestamp",
    COALESCE(tps.participants, ARRAY[]::json[]) as participants,
    COALESCE(tps.subscribers, ARRAY[]::text[]) as subscribers,
    COALESCE(mm.mentioned, ARRAY[]::text[]) AS mentioned,
    COALESCE(rs.repliers, ARRAY[]::text[]) as repliers,
    COALESCE(rs."actionMessageRepliers", ARRAY[]::text[]) as "actionMessageRepliers",
    t.name,
    t.url,
    p."contextData" as location,
    t.metadata
FROM threads t
INNER JOIN orgs o ON t."orgID" = o.id
INNER JOIN pages p ON p."contextHash" = t."pageContextHash" AND p."orgID" = t."orgID" ${locationFilter}
LEFT JOIN (
    SELECT 
        m."threadID" as id, 
        COUNT (*), 
        SUM(CASE WHEN m."type" = 'user_message' AND m."deletedTimestamp" IS NULL THEN 1 ELSE 0 END) as userMessagesCount,
        SUM(CASE WHEN m."type" = 'action_message' AND m."deletedTimestamp" IS NULL THEN 1 ELSE 0 END) as actionMessagesCount,
        SUM(CASE WHEN m."deletedTimestamp" IS NOT NULL THEN 1 ELSE 0 END) as deletedMessagesCount,
        MAX(m.timestamp) as "lastCreated",
        MIN(m.timestamp) as "firstCreated"
    FROM messages m
    WHERE m."platformApplicationID" = $1
    GROUP BY m."threadID"
) as mc ON mc.id = t.id
LEFT JOIN (
    SELECT
        tp."threadID" as id,
        array_agg(json_build_object('lastSeenTimestamp', tp."lastSeenTimestamp", 'userID', u."externalID")) AS participants,
        array_agg(DISTINCT u."externalID") FILTER (WHERE tp.subscribed) AS subscribers
        FROM thread_participants tp
    INNER JOIN users u on tp."userID" = u.id
    INNER JOIN orgs o on tp."orgID" = o.id
    WHERE o."platformApplicationID" = $1
    GROUP BY tp."threadID"
) as tps ON tps.id = t.id
LEFT JOIN (
  SELECT
    "threadID" as id,
    array_agg(DISTINCT "externalID") FILTER (WHERE type = 'user_message') AS repliers,
    array_agg(DISTINCT "externalID") FILTER (WHERE type = 'action_message') AS "actionMessageRepliers" 
  FROM (
    SELECT
      m."threadID",
      m."type",
      u."externalID",
      m."deletedTimestamp",
      ROW_NUMBER() OVER (PARTITION BY m."threadID" ORDER BY m."timestamp") AS sorted_message_idx
    FROM messages m
    INNER JOIN users u ON m."sourceID" = u.id
    WHERE m."platformApplicationID" = $1
  ) as sub
  WHERE sorted_message_idx > 1
  AND "deletedTimestamp" IS NULL
  GROUP BY "threadID"
) as rs ON rs.id = t.id
LEFT JOIN (
  SELECT
    m."threadID" AS id,
    array_agg(DISTINCT u."externalID") AS mentioned
  FROM messages m
    INNER JOIN message_mentions mm ON (m.id = mm."messageID")
    INNER JOIN users u ON (u.id = mm."userID")
  WHERE m."platformApplicationID" = $1
  GROUP BY m."threadID"
) as mm ON mm.id = t.id
WHERE t."platformApplicationID" = $1 
${filters.join(' ')}
${cursor}
ORDER BY COALESCE(mc."lastCreated", t."createdTimestamp") DESC, t."externalID" ASC
${limitQuery}
`,
    {
      bind: bindVariables,
      type: QueryTypes.SELECT,
    },
  );

  const lastThread = data.length === 0 ? null : data[data.length - 1];
  const returnToken =
    data.length === resultsLimit && lastThread
      ? encodeToken({
          externalID: lastThread.id,
          nextCursorTimestamp: lastThread.nextCursorTimestamp,
        })
      : null;

  const typingUsersByThread = await loadTypingUsers(
    data.map((t) => t.internalID),
  );

  const results: CoreThreadData[] = data.map(
    ({ internalID, nextCursorTimestamp: _, ...rest }) => ({
      ...rest,
      groupID: rest.organizationID,
      typing: typingUsersByThread.get(internalID) ?? [],
    }),
  );

  const threadsTotal = await getSequelize().query<{ count: number }>(
    `
  SELECT COUNT(t.id)::integer FROM threads t
  INNER JOIN orgs o ON t."orgID" = o.id
  INNER JOIN pages p ON p."contextHash" = t."pageContextHash" AND p."orgID" = t."orgID" ${locationFilter}
  LEFT JOIN (
    SELECT
          m."threadID" as id,
          COUNT (*),
          MAX(m.timestamp) as "lastCreated",
          MIN(m.timestamp) as "firstCreated"
      FROM messages m
      GROUP BY m."threadID"
  ) as mc ON mc.id = t.id
  WHERE t."platformApplicationID" = $1
  ${filters.join(' ')}
  `,
    {
      bind: countBindVariables,
      type: QueryTypes.SELECT,
    },
  );

  const paginatedResults = {
    threads: results,
    pagination: {
      token: returnToken,
      total: threadsTotal[0].count,
    },
  };
  return paginatedResults;
}

async function parseThreadsRequest(req: Request) {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const {
    location,
    metadata,
    firstMessageTimestamp,
    mostRecentMessageTimestamp,
    groupID,
    resolvedStatus,
  } = validateFilter(req.query, {
    location: true,
    metadata: true,
    firstMessageTimestamp: true,
    mostRecentMessageTimestamp: true,
    groupID: true,
    authorID: false,
    resolvedStatus: true,
    viewer: false,
  });
  const { limit, token } = req.query;
  const decodedToken =
    token &&
    validatePaginationToken({
      token,
      endpoint: 'threads',
    });

  const resultsLimit = validateLimit(limit, DEFAULT_LIMIT);
  const bindVariables: (string | Date | number)[] = [platformApplicationID];
  const filters = [];
  let cursor = '';
  let locationFilter = '';

  if (groupID) {
    const orgEntity = await OrgEntity.findOne({
      where: { externalID: groupID, platformApplicationID },
    });

    if (!orgEntity) {
      throw new ApiCallerError('group_not_found');
    }

    bindVariables.push(orgEntity.id);
    filters.push(`AND t."orgID" = $${bindVariables.length}`);
  }
  if (location) {
    bindVariables.push(JSON.stringify(location.value));
    locationFilter = `AND p."contextData" ${
      location.partialMatch ? '@>' : '='
    } $${bindVariables.length}::jsonb`;
  }
  if (metadata) {
    bindVariables.push(JSON.stringify(metadata));
    filters.push(`AND t.metadata @> $${bindVariables.length}::jsonb`);
  }
  if (firstMessageTimestamp) {
    if (firstMessageTimestamp.from) {
      bindVariables.push(firstMessageTimestamp.from);
      filters.push(
        `AND COALESCE(mc."firstCreated", t."createdTimestamp") >= $${bindVariables.length}::timestamp`,
      );
    }
    if (firstMessageTimestamp.to) {
      bindVariables.push(firstMessageTimestamp.to);
      filters.push(
        `AND COALESCE(mc."firstCreated", t."createdTimestamp") <= $${bindVariables.length}::timestamp`,
      );
    }
  }
  if (mostRecentMessageTimestamp) {
    if (mostRecentMessageTimestamp.from) {
      bindVariables.push(mostRecentMessageTimestamp.from);
      filters.push(
        `AND mc."lastCreated" >= $${bindVariables.length}::timestamp`,
      );
    }
    if (mostRecentMessageTimestamp.to) {
      bindVariables.push(mostRecentMessageTimestamp.to);
      filters.push(
        `AND mc."lastCreated" <= $${bindVariables.length}::timestamp`,
      );
    }
  }
  if (resolvedStatus) {
    switch (resolvedStatus) {
      case 'any': {
        // Do Nothing as the default returns both resolved and unresolved
        break;
      }
      case 'resolved': {
        filters.push(`AND t."resolvedTimestamp" IS NOT NULL`);
        break;
      }
      case 'unresolved': {
        filters.push(`AND t."resolvedTimestamp" IS NULL`);
        break;
      }
    }
  }

  // create bind for total count without pagination query
  const countBindVariables = [...bindVariables];
  bindVariables.push(resultsLimit);
  const limitQuery = `LIMIT $${bindVariables.length}`;

  if (decodedToken) {
    bindVariables.push(
      decodedToken.nextCursorTimestamp,
      decodedToken.externalID,
    );
    cursor = `AND (
      COALESCE(mc."lastCreated", t."createdTimestamp") < $${
        bindVariables.length - 1
      }::timestamp
      OR
      (
        COALESCE(mc."lastCreated", t."createdTimestamp") = $${
          bindVariables.length - 1
        }::timestamp
        AND t."externalID" > $${bindVariables.length}
      )
    )`;
  }

  return {
    bindVariables,
    countBindVariables,
    locationFilter,
    filters,
    cursor,
    limitQuery,
    resultsLimit,
  };
}

export default forwardHandlerExceptionsToNext(listThreadsHandler);
