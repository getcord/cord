import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const notificationDeletedResolver: Resolvers['NotificationDeleted'] = {
  id: ({ payload: { notificationID } }) => notificationID,
};
