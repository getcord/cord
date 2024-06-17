/* eslint-disable import/no-restricted-paths */
import type {
  NotificationFilterInput,
  NotificationsQueryResult,
} from 'external/src/graphql/operations.ts';
import NotificationsQuery from 'external/src/graphql/NotificationsQuery.graphql';
/* eslint-enable import/no-restricted-paths */

import type { Viewer } from 'server/src/auth/index.ts';
import { executeGraphQLOperation } from 'server/src/tests/setupEnvironment.ts';

export async function fetchNotificationsViaGraphQL(
  viewer: Viewer,
  {
    first = 9999,
    after = '',
    filter = undefined,
  }: { first?: number; after?: string; filter?: NotificationFilterInput } = {},
): Promise<NotificationsQueryResult['notifications']> {
  const result = await executeGraphQLOperation({
    query: NotificationsQuery,
    variables: {
      first,
      after,
      filter,
    },
    viewer,
  });

  return result.data!.notifications;
}
