import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { assert } from 'common/util/index.ts';
import { fetchAndBuildNotifications } from 'server/src/notifications/fetch.ts';
import { ClientFacingError } from 'server/src/util/ClientFacingError.ts';
import { Errors } from 'common/const/Errors.ts';

export const notificationAttachmentResolver: Resolvers['NotificationAttachment'] =
  {
    __resolveType: (attachment) => {
      if ('message' in attachment) {
        return 'NotificationMessageAttachment';
      } else if ('thread' in attachment) {
        return 'NotificationThreadAttachment';
      } else if ('url' in attachment) {
        return 'NotificationURLAttachment';
      } else {
        throw new Error('Invalid attachment');
      }
    },
  };

export const notificationSenderResolver: Resolvers['NotificationSender'] = {
  __resolveType: () => 'User',
};

export const notificationHeaderNodeResolver: Resolvers['NotificationHeaderNode'] =
  {
    __resolveType: (node) => {
      if ('user' in node) {
        return 'NotificationHeaderUserNode';
      } else if ('text' in node) {
        return 'NotificationHeaderTextNode';
      } else {
        throw new Error('Invalid notification header');
      }
    },
  };

// Deliberately not exported! Please treat cursors as opaque strings.
const CURSOR_V1 = 'v1';
const CURSOR_SEPARATOR = ':';

export const notificationsResolver: Resolvers['Query']['notifications'] =
  async (_, args, context) => {
    // TODO(notifications) this is the absolute dumbest possible implementation
    // of pagination. It is pretty darn dumb (but also pretty darn simple) -- we
    // will likely have to upgrade it at some point.
    //
    // We simply fetch `first` rows from the DB which are older than the
    // timestamp encoded in `after` and turn that into a batch of Notification
    // results.  The timestamp of the oldest one becomes the `after` cursor
    // timestamp.
    //
    // The `after` cursor encodes a version; currently there is only one version, so we
    // just use it as a consistency check, but this gives us an easy way to
    // change cursor behaviour without worrying about backwards compatibility.
    //
    // This all has some notable shortcomings:
    //  - We will return fewer than `first` results if any aggregation happens,
    //  since we only ever fetch `first` rows from the DB. This could be solved
    //  by going back to the DB to fetch more rows until we have `first` results
    //  (or exhaust the DB).
    //  - If DB rows which otherwise would be aggregated are across a pagination
    //  boundary, we will not aggregate them. This is much harder to solve,
    //  since the rows that we want to aggregate into this page of results can
    //  be older than results that should be on the next page (which we then
    //  need to skip somehow when the next page is requested).

    // TODO(notifications): use a stronger type here. Maybe
    // WhereOptions<NotificationEntity>, but this then complains about the type
    // of the metadata field.
    let ltCreatedTimestamp: Date | undefined = undefined;
    if (args.after) {
      const split = args.after.split(CURSOR_SEPARATOR);
      assert(split.length === 2 && split[0] === CURSOR_V1, 'Invalid cursor');
      ltCreatedTimestamp = new Date(parseInt(split[1]));
    }

    if (args.filter?.organizationID) {
      const userCanAccess =
        await context.loaders.orgMembersLoader.viewerCanAccessOrgExternalID(
          args.filter?.organizationID,
        );

      if (!userCanAccess) {
        throw new ClientFacingError(Errors.USER_NOT_IN_GROUP);
      }
    }

    const { entities, nodes } = await fetchAndBuildNotifications(context, {
      ltCreatedTimestamp,
      filter: args.filter
        ? {
            metadata: args.filter.metadata ?? undefined,
            location: args.filter.location
              ? {
                  value: args.filter.location,
                  partialMatch: !!args.filter.partialMatch,
                }
              : undefined,
            organizationID: args.filter.organizationID ?? undefined,
          }
        : undefined,
      limit: args.first,
    });

    return {
      nodes,
      paginationInfo: {
        // This is technically wrong when *exactly* as many notifs as exist are
        // requested. It's slightly fiddly/annoying to fix so we'll just roll
        // with it -- the client will need to deal with getting hasNextPage=true
        // but the next page being empty. Which will lead to a slightly weird UX
        // where a loading spinner comes up and results in no more notifs, but
        // is not a huge deal right now.
        hasNextPage: entities.length === args.first,
        endCursor:
          entities.length > 0
            ? [
                CURSOR_V1,
                // Grab the timestamp, minus one millisecond -- even though we
                // do a strict less-than when consuming this, we still need to
                // subtract one: postgres stores microsecond resolution but JS
                // only deals in milisecond resolution, and so the microseconds
                // can get rounded *up* to the larger milisecond, which will
                // cause us to return a duplicate row from the previous page.
                // Subtracting the one means we will always be less. This could
                // cause weirdness if two notification rows come in within the
                // same milisecond and a pagination boundary falls between them,
                // but that is such an edge case I'm not worried. Once JS
                // properly supports microseconds and sequelize is updated, we
                // should switch to that and remove the subtraction here. cf.
                // https://github.com/sequelize/sequelize/issues/14295
                entities[entities.length - 1].createdTimestamp.getTime() - 1,
              ].join(CURSOR_SEPARATOR)
            : '',
      },
    };
  };
