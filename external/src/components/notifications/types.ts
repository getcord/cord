import type { NotificationsQueryResult } from 'external/src/graphql/operations.ts';

export type NotificationsQueryResultNode =
  NotificationsQueryResult['notifications']['nodes'][number];

export type NotificationsQueryResultHeaderNode =
  NotificationsQueryResultNode['header'][number];
