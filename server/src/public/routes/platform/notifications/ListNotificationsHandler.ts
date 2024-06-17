import type { Request, Response } from 'express';

import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { fetchAndBuildNotifications } from 'server/src/notifications/fetch.ts';
import { gqlNotificationToNotificationVariables } from 'server/src/notifications/convert.ts';
import { createViewerAndContext } from 'server/src/util/createViewerAndContext.ts';
import { validateFilter } from 'server/src/public/routes/platform/validateQuery.ts';

async function listNotificationsHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;

  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_request');
  }

  const user = await UserEntity.findOne({
    where: { platformApplicationID, externalID: req.params.userID },
  });
  if (!user) {
    throw new ApiCallerError('user_not_found');
  }

  const { location, metadata, groupID } = validateFilter(req.query, {
    location: true,
    metadata: true,
    firstMessageTimestamp: false,
    mostRecentMessageTimestamp: false,
    groupID: true,
    authorID: false,
    resolvedStatus: false,
    viewer: false,
  });

  const context = await createViewerAndContext(
    platformApplicationID,
    user,
    'api',
  );

  const { nodes: gqlNotifs } = await fetchAndBuildNotifications(context, {
    ltCreatedTimestamp: undefined,
    limit: undefined,
    filter: {
      metadata,
      location,
      groupID,
    },
  });

  res
    .status(200)
    .json(
      await Promise.all(
        gqlNotifs.map((notif) =>
          gqlNotificationToNotificationVariables(context.loaders, notif),
        ),
      ),
    );
}

export default forwardHandlerExceptionsToNext(listNotificationsHandler);
