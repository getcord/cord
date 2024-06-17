import type { Request, Response } from 'express';
import { forwardHandlerExceptionsToNext } from 'server/src/public/routes/platform/util.ts';
import { assertRequestHasContext } from 'server/src/RequestContext.ts';
import { executeNotificationSummaryQuery } from 'server/src/schema/operations.ts';
import type { NotificationSummary } from '@cord-sdk/types';
import { validateFilter } from 'server/src/public/routes/platform/validateQuery.ts';

async function getClientNotificationCountsHandler(req: Request, res: Response) {
  const context = assertRequestHasContext(req);

  const { location, metadata, groupID } = validateFilter(req.query, {
    location: true,
    metadata: true,
    groupID: true,
    resolvedStatus: false,
    viewer: false,
    firstMessageTimestamp: false,
    mostRecentMessageTimestamp: false,
    authorID: false,
  });

  const data = await executeNotificationSummaryQuery({
    context,
    variables: {
      filter: {
        location: location?.value,
        partialMatch: location?.partialMatch,
        metadata,
        organizationID: groupID,
      },
    },
  });

  const result: NotificationSummary = {
    unread: data.notificationSummary.unreadNotificationCount,
  };

  return res.status(200).json(result);
}

export default forwardHandlerExceptionsToNext(
  getClientNotificationCountsHandler,
);
