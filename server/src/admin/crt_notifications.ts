import type { UUID } from 'common/types/index.ts';
import { getServerAuthToken } from '@cord-sdk/server';
import type { ServerCreateNotification } from '@cord-sdk/types';
import {
  ADMIN_APP_ID,
  ADMIN_APP_SECRET,
} from 'server/src/admin/queries/cord_session_token.ts';
import env from 'server/src/config/Env.ts';
import { AdminCRTCustomerIssueSubscriptionEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueSubscriptionEntity.ts';

export async function sendCustomerIssueNotification(notification: {
  issueID: UUID;
  actor: UUID;
  assignee: string | undefined | null;
  template: string;
}) {
  const recipients = [];
  if (notification.assignee && notification.assignee !== notification.actor) {
    recipients.push(notification.assignee);
  }

  const subscribers = await AdminCRTCustomerIssueSubscriptionEntity.findAll({
    where: { issueID: notification.issueID },
  });
  subscribers.forEach((subscriber) => {
    if (
      subscriber.userID !== notification.assignee &&
      subscriber.userID !== notification.actor
    ) {
      recipients.push(subscriber.userID);
    }
  });

  if (recipients.length === 0) {
    return;
  }

  const CORD_NOTIFICATIONS_ENDPOINT = `https://${env.API_SERVER_HOST}/v1/notifications`;

  const serverAuthToken = getServerAuthToken(ADMIN_APP_ID, ADMIN_APP_SECRET);

  const results = await Promise.all(
    recipients.map((recipient) => {
      const notificationJson: ServerCreateNotification = {
        actorID: notification.actor,
        recipientID: recipient,
        template: notification.template,
        extraClassnames: null,
        type: 'url',
        url: `https://${env.ADMIN_SERVER_HOST}/issues/${notification.issueID}`,
      };

      return fetch(CORD_NOTIFICATIONS_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(notificationJson),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
      });
    }),
  );
  results.forEach((result) => {
    if (!result.ok) {
      throw new Error('Failed to send notification');
    }
  });
}
