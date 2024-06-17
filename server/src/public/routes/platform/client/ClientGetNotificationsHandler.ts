import type { Request, Response } from 'express';
import { unique } from 'radash';
import { forwardHandlerExceptionsToNext } from 'server/src/public/routes/platform/util.ts';
import { assertRequestHasContext } from 'server/src/RequestContext.ts';
import { executeNotificationsQuery } from 'server/src/schema/operations.ts';
import type { ClientNotificationData } from '@cord-sdk/types';
import { validateFilter } from 'server/src/public/routes/platform/validateQuery.ts';
import { DEFAULT_NOTIFICATION_INITIAL_PAGE_SIZE } from 'common/const/Api.ts';
import { getMentionedUserIDs } from 'common/util/index.ts';
import { getUserByInternalIdFunction } from 'server/src/public/routes/platform/client/util.ts';
import { gqlNotificationFragmentToNotificationVariables } from 'common/util/convertToExternal/notification.ts';

// fetchMore is a function, which we can't return
type RestNotificationData = Omit<ClientNotificationData, 'fetchMore'>;

async function getClientNotificationsHandler(req: Request, res: Response) {
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

  const data = await executeNotificationsQuery({
    context,
    variables: {
      first: DEFAULT_NOTIFICATION_INITIAL_PAGE_SIZE,
      after: undefined,
      filter: {
        location: location?.value,
        partialMatch: location?.partialMatch,
        metadata,
        organizationID: groupID,
      },
    },
  });

  const userIDs = unique(
    data.notifications.nodes.flatMap((n) =>
      n.attachment && 'message' in n.attachment
        ? getMentionedUserIDs(n.attachment.message.content ?? [])
        : [],
    ),
  );
  const userByInternalID = await getUserByInternalIdFunction(context, userIDs);

  const result: RestNotificationData = {
    notifications: data.notifications.nodes.map((n) =>
      gqlNotificationFragmentToNotificationVariables(n, userByInternalID),
    ),
    loading: false,
    hasMore: data.notifications.paginationInfo.hasNextPage,
  };

  return res.status(200).json(result);
}

export default forwardHandlerExceptionsToNext(getClientNotificationsHandler);
