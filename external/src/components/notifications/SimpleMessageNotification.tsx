import { useCallback } from 'react';

import { createUseStyles } from 'react-jss';
import { useNavigateToThreadPage } from 'external/src/effects/useNavigateToThreadPage.ts';
import type { NotificationsMessageFragment } from 'external/src/graphql/operations.ts';
import { SimpleNotificationWrapper } from 'external/src/components/notifications/SimpleNotificationWrapper.tsx';
import { StructuredMessage2 } from 'external/src/components/chat/message/StructuredMessage2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import type { NotificationsQueryResultNode } from 'external/src/components/notifications/types.ts';

type Props = {
  notification: NotificationsQueryResultNode;
  message: NotificationsMessageFragment;
};

const useStyles = createUseStyles({
  attachment: {
    display: '-webkit-box',
    overflow: 'hidden',
    '-webkit-box-orient': 'vertical',
    '-webkit-line-clamp': '2',
    // Increase specificity to override the normal StructuredMessage font
    // colour.
    '& p': {
      color: cssVar('notification-content-text-color'),
    },
  },
});

export function SimpleMessageNotification({ notification, message }: Props) {
  // TODO (notifications) placeholder deep linking solution

  const styles = useStyles();
  const openThreadPage = useNavigateToThreadPage({
    url: message.thread.url,
    threadID: message.thread.id,
    externalThreadID: message.thread.externalID,
    location: message.thread.location,
    targetOrgID: message.thread.externalOrgID,
    navigationUrl: message.thread.navigationURL,
    navigationTarget: '_top',
  });
  const onClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      void openThreadPage();
    },
    [openThreadPage],
  );

  // TODO(notifications) as written this renders all of the possible things that
  // can be inside a `StructuredMessage`/`MessageContent`. Is that what we want?
  //
  // TODO(notifications) is `true` the correct value of
  // `hideAnnotationAttachment`?
  //
  // TODO(notifications) are we dealing with deleted messages properly? That's
  // why we need the `any` cast...
  return (
    <SimpleNotificationWrapper
      notification={notification}
      onClick={onClick}
      href={message.thread.url}
      attachment={
        <div className={styles.attachment}>
          <StructuredMessage2
            message={message}
            content={message.content}
            wasEdited={false}
            isMessageBeingEdited={false}
            hideAnnotationAttachment={true}
          />
        </div>
      }
    />
  );
}
