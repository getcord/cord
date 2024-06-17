import { createUseStyles } from 'react-jss';

import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { editorStyles } from 'common/ui/editorStyles.ts';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import type {
  NotificationsQueryResultHeaderNode,
  NotificationsQueryResultNode,
} from 'external/src/components/notifications/types.ts';

const useStyles = createUseStyles({
  headerContainer: {
    ...editorStyles,
    // Needed for -webkit-line-clamp to work
    display: '-webkit-box',
    flex: 1,
    gap: cssVar('space-3xs'),
    overflow: 'hidden',
    // Needed for -webkit-line-clamp to work
    '-webkit-box-orient': 'vertical',
    // Supported on latest versions of Chrome, Edge, Safari, FF and Opera.
    '-webkit-line-clamp': 2,
  },
  notificationHeaderTextColor: {
    color: cssVar('notification-header-text-color'),
  },
  notificationHeaderEmphasisTextColor: {
    color: cssVar('notification-header-emphasis-text-color'),
  },
});

export function StructuredNotificationHeader({
  notification,
}: {
  notification: NotificationsQueryResultNode;
}) {
  const classes = useStyles();
  const headerContent = notification.header.map((node, index) =>
    renderNotificationHeaderNodes({ node, index }),
  );
  return <Box2 className={classes.headerContainer}>{headerContent}</Box2>;
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

// TODO (notifications) move into separate files when necessary
function NotificationUserReferenceElement({ userName }: { userName: string }) {
  const classes = useStyles();

  return (
    <Text2
      className={classes.notificationHeaderEmphasisTextColor}
      color="content-emphasis"
      as="span"
      font="body-emphasis"
    >
      {userName}
    </Text2>
  );
}

function NotificationTextElement({
  node,
}: {
  node: NotificationsQueryResultHeaderNode & {
    __typename: 'NotificationHeaderTextNode';
  };
}) {
  const classes = useStyles();
  let element = <>{node.text}</>;

  if (node.bold) {
    element = (
      <Text2
        className={classes.notificationHeaderEmphasisTextColor}
        color="content-emphasis"
        as="span"
        font="body-emphasis"
      >
        {node.text}
      </Text2>
    );
  }

  return <span className={classes.notificationHeaderTextColor}>{element}</span>;
}
