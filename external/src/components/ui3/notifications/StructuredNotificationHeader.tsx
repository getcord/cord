import type {
  NotificationsQueryResultHeaderNode,
  NotificationsQueryResultNode,
} from 'external/src/components/notifications/types.ts';

import * as classes from 'external/src/components/ui3/notifications/StructuredNotificationHeader.css.ts';
import { CordTrans, useCordTranslation } from '@cord-sdk/react';
import { convertGqlNotificationHeaderTranslation } from 'common/util/convertToExternal/notification.ts';

export function StructuredNotificationHeader({
  notification,
}: {
  notification: NotificationsQueryResultNode;
}) {
  const { t } = useCordTranslation('notification_templates');
  if (notification.headerTranslationKey) {
    const translation = convertGqlNotificationHeaderTranslation(notification)!;
    return (
      <div className={classes.notificationHeaderContainer}>
        <span className={classes.notificationHeaderText}>
          <CordTrans
            t={t}
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            i18nKey={translation.key as any}
            values={translation.parameters}
            components={{
              bold: <span className={classes.notificationHeaderBold} />,
              user: <span className={classes.notificationHeaderUserMention} />,
            }}
          />
        </span>
      </div>
    );
  }
  const headerContent = notification.header.map((node, index) =>
    renderNotificationHeaderNodes({ node, index }),
  );
  return (
    <div className={classes.notificationHeaderContainer}>{headerContent}</div>
  );
}

function renderNotificationHeaderNodes({
  node,
  index,
}: {
  node: NotificationsQueryResultHeaderNode;
  index: number;
}) {
  switch (node.__typename) {
    case 'NotificationHeaderUserNode':
      return (
        <NotificationUserReferenceElement
          userName={node.user.displayName}
          key={index}
        />
      );

    case 'NotificationHeaderTextNode':
      return <NotificationTextElement node={node} key={index} />;
  }
}

function NotificationUserReferenceElement({ userName }: { userName: string }) {
  return (
    <span className={classes.notificationHeaderUserMention}>{userName}</span>
  );
}

function NotificationTextElement({
  node,
}: {
  node: NotificationsQueryResultHeaderNode & {
    __typename: 'NotificationHeaderTextNode';
  };
}) {
  let element = <>{node.text}</>;

  if (node.bold) {
    element = (
      <span className={classes.notificationHeaderBold}>{node.text}</span>
    );
  }

  return <span className={classes.notificationHeaderText}>{element}</span>;
}
