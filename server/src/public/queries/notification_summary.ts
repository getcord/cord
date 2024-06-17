import type { NotificationFilterInput } from 'common/graphql/types.ts';
import type { Maybe, NotificationListFilter } from 'common/types/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export function notificationFilterInputToNotificationListFilter(
  filter: Maybe<NotificationFilterInput>,
): NotificationListFilter {
  return {
    metadata: filter?.metadata ?? undefined,
    location: filter?.location
      ? { value: filter.location, partialMatch: !!filter.partialMatch }
      : undefined,
    organizationID: filter?.organizationID ?? undefined,
  };
}

export const notificationSummaryQueryResolver: Resolvers['Query']['notificationSummary'] =
  (_, args, _context) => ({
    filter: notificationFilterInputToNotificationListFilter(args.filter),
  });
