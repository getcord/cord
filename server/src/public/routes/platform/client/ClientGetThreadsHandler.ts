import type { Request, Response } from 'express';
import { unique } from 'radash';
import { forwardHandlerExceptionsToNext } from 'server/src/public/routes/platform/util.ts';
import { assertRequestHasContext } from 'server/src/RequestContext.ts';
import {
  executeThreadActivityQuery,
  executeThreadListQuery,
} from 'server/src/schema/operations.ts';
import type { ThreadsData } from '@cord-sdk/types';
import {
  validateFilter,
  validateInitialFetchCount,
  validateSort,
} from 'server/src/public/routes/platform/validateQuery.ts';
import { getThreadSummary } from 'common/util/convertToExternal/thread.ts';
import {
  collectNeededUserIDs,
  getUserByInternalIdFunction,
} from 'server/src/public/routes/platform/client/util.ts';

// fetchMore is a function, which we can't return
type RestThreadsData = Omit<ThreadsData, 'fetchMore'>;

async function getClientThreadsHandler(req: Request, res: Response) {
  const context = assertRequestHasContext(req);

  const { location, metadata, resolvedStatus, groupID, viewer } =
    validateFilter(req.query, {
      location: true,
      metadata: true,
      resolvedStatus: true,
      groupID: true,
      viewer: true,
      firstMessageTimestamp: false,
      mostRecentMessageTimestamp: false,
      authorID: false,
    });

  const sort = validateSort(req.query);
  const limit = validateInitialFetchCount(req.query);

  const [threadsGraphQL, countsGraphQL] = await Promise.all([
    executeThreadListQuery({
      context,
      variables: {
        _externalOrgID: groupID,
        location: location?.value,
        partialMatch: location?.partialMatch,
        filter: { metadata, viewer },
        resolved:
          resolvedStatus === 'resolved'
            ? true
            : resolvedStatus === 'unresolved'
            ? false
            : undefined,
        sort,
        limit,
        after: undefined,
      },
    }),
    executeThreadActivityQuery({
      context,
      variables: {
        _externalOrgID: groupID,
        pageContext: location
          ? { data: location.value, providerID: null }
          : undefined,
        partialMatch: location?.partialMatch,
        viewer,
        metadata,
        resolved:
          resolvedStatus === 'resolved'
            ? true
            : resolvedStatus === 'unresolved'
            ? false
            : undefined,
      },
    }),
  ]);

  const userIDs = unique(
    threadsGraphQL.threadsAtLocation.threads.flatMap((t) =>
      collectNeededUserIDs(t),
    ),
  );
  const userByInternalID = await getUserByInternalIdFunction(context, userIDs);

  const activity = countsGraphQL.activity.threadSummary;

  const result: RestThreadsData = {
    threads: threadsGraphQL.threadsAtLocation.threads.map((t) =>
      getThreadSummary(
        { ...t, messages: t.initialMessagesInclDeleted },
        userByInternalID,
      ),
    ),
    counts: {
      total: activity.totalThreadCount,
      unread: activity.unreadThreadCount,
      new: activity.newThreadCount,
      unreadSubscribed: activity.unreadSubscribedThreadCount,
      resolved: activity.resolvedThreadCount,
      empty: activity.emptyThreadCount,
    },
    loading: false,
    hasMore: threadsGraphQL.threadsAtLocation.hasMore,
  };

  return res.status(200).json(result);
}

export default forwardHandlerExceptionsToNext(getClientThreadsHandler);
