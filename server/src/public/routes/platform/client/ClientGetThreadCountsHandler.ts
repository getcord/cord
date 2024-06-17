import type { Request, Response } from 'express';
import { forwardHandlerExceptionsToNext } from 'server/src/public/routes/platform/util.ts';
import { assertRequestHasContext } from 'server/src/RequestContext.ts';
import { executeThreadActivityQuery } from 'server/src/schema/operations.ts';
import type { ThreadActivitySummary } from '@cord-sdk/types';
import { validateFilter } from 'server/src/public/routes/platform/validateQuery.ts';

async function getClientThreadCountsHandler(req: Request, res: Response) {
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

  const data = await executeThreadActivityQuery({
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
  });

  const activity = data.activity.threadSummary;

  const result: ThreadActivitySummary = {
    total: activity.totalThreadCount,
    unread: activity.unreadThreadCount,
    new: activity.newThreadCount,
    unreadSubscribed: activity.unreadSubscribedThreadCount,
    resolved: activity.resolvedThreadCount,
    empty: activity.emptyThreadCount,
  };

  return res.status(200).json(result);
}

export default forwardHandlerExceptionsToNext(getClientThreadCountsHandler);
