import type { NotificationChannels, UUID } from 'common/types/index.ts';

export const defaultNotificationPreference: NotificationChannels = {
  slack: true,
  email: true,
};

export const getNotificationChannels = (
  notificationChannelPreference: NotificationChannels | undefined,
  targetUserID: UUID,
  targetHasEmail: boolean,
  isTargetConnectedToSlack: boolean,
) => {
  let notificationChannels: NotificationChannels =
    notificationChannelPreference ?? defaultNotificationPreference;

  notificationChannels = {
    slack: notificationChannels.slack && isTargetConnectedToSlack,
    email: notificationChannels.email && targetHasEmail,
  };

  return notificationChannels;
};
