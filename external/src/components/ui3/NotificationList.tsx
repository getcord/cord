import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  forwardRef,
} from 'react';

import { SimpleThreadNotification } from 'external/src/components/notifications/SimpleThreadNotification.tsx';
import { useCordTranslation } from '@cord-sdk/react';
import type { NotificationReactComponentProps } from '@cord-sdk/react/components/Notification.tsx';
import { EmptyStateWithIcon } from 'external/src/components/ui3/EmptyStateWithIcon.tsx';
import { SimpleMessageNotification } from 'external/src/components/ui3/notifications/SimpleMessageNotification.tsx';
import { SimpleURLNotification } from 'external/src/components/notifications/SimpleURLNotification.tsx';
import { SpinnerCover } from 'external/src/components/SpinnerCover.tsx';
import { Button } from 'external/src/components/ui3/Button.tsx';
import { NotificationListContents } from 'external/src/context/notifications/NotificationListContents.tsx';
import { NotificationsListContext } from 'external/src/context/notifications/NotificationsContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import type { NotificationListReactComponentProps } from '@cord-sdk/react/components/NotificationList.tsx';
import { ErrorHandler } from 'external/src/logging/ErrorHandler.tsx';
import * as classes from 'external/src/components/ui3/NotificationList.css.ts';
import { fontBodyEmphasis } from 'common/ui/atomicClasses/fonts.css.ts';
import { composeRefs } from '@cord-sdk/react/common/lib/composeRefs.ts';
import type { NotificationsNodeFragment } from 'external/src/graphql/operations.ts';
import { NotificationsListProvider } from 'external/src/context/notifications/NotificationsListProvider.tsx';

export const NotificationList = forwardRef(function NotificationList(
  {
    maxCount = 10,
    fetchAdditionalCount = maxCount,
    showPlaceholder = true,
    filter = undefined,
    style,
    onClickNotification,
  }: NotificationListReactComponentProps & {
    internalHostStyles?: boolean;
  },
  ref: React.Ref<HTMLDivElement>,
) {
  return (
    <NotificationsListProvider firstLoadCount={maxCount} filter={filter}>
      <NotificationListImpl
        maxCount={maxCount}
        fetchAdditionalCount={fetchAdditionalCount}
        showPlaceholder={showPlaceholder}
        ref={ref}
        style={style}
        onClickNotification={onClickNotification}
      />
    </NotificationsListProvider>
  );
});

const NotificationListImpl = forwardRef(function NotificationListImpl(
  {
    maxCount,
    fetchAdditionalCount,
    showPlaceholder,
    style,
    onClickNotification,
  }: Required<
    Pick<
      NotificationListReactComponentProps,
      'maxCount' | 'fetchAdditionalCount' | 'showPlaceholder'
    >
  > &
    Pick<NotificationListReactComponentProps, 'style' | 'onClickNotification'>,
  ref: React.Ref<HTMLDivElement>,
) {
  const { t } = useCordTranslation('notifications');
  const {
    notifications,
    loading,
    hasMore,
    fetchAdditionalNotifications,
    markAllNotificationsAsRead,
    error,
  } = useContextThrowingIfNoProvider(NotificationsListContext);

  const [countWanted, setCountWanted] = useState(maxCount);
  const increaseCountWanted = useCallback(() => {
    if (!loading && !error && hasMore) {
      setCountWanted((n) => n + fetchAdditionalCount);
    }
  }, [fetchAdditionalCount, hasMore, loading, error]);

  const notificationNodes = useMemo(
    () => notifications.slice(0, countWanted),
    [countWanted, notifications],
  );

  useEffect(() => {
    if (
      !loading &&
      !error &&
      hasMore &&
      countWanted > notificationNodes.length
    ) {
      void fetchAdditionalNotifications(countWanted - notificationNodes.length);
    }
  }, [
    countWanted,
    fetchAdditionalNotifications,
    hasMore,
    loading,
    notificationNodes.length,
    error,
  ]);

  const isNotificationListEmpty = notificationNodes.length === 0;

  const { logEvent } = useLogger();

  useEffect(() => {
    logEvent('notification-list-render', {
      count: notificationNodes.length,
    });
  }, [logEvent, notificationNodes.length]);

  const onMarkAllAsReadClick = useCallback(() => {
    markAllNotificationsAsRead();
    logEvent('notification-list-mark-all-as-read-onclick');
  }, [markAllNotificationsAsRead, logEvent]);

  const notificationWrapperContainerRef = useRef<HTMLDivElement | null>(null);

  const notificationsInitiallyEmptyRef = useRef<boolean>();

  useEffect(() => {
    // We only want to set notificationsInitiallyEmptyRef once, and only when
    // notifications have loaded so we use useEffect
    if (!loading && isNotificationListEmpty) {
      notificationsInitiallyEmptyRef.current = isNotificationListEmpty;
    }
  }, [isNotificationListEmpty, loading]);

  const renderNotifications = useMemo(
    () =>
      notificationNodes.map((node) => {
        return (
          <ErrorHandler key={node.id}>
            <NotificationImpl node={node} onClick={onClickNotification} />
          </ErrorHandler>
        );
      }),
    [notificationNodes, onClickNotification],
  );

  const composedRefs = composeRefs(ref, notificationWrapperContainerRef);

  return (
    <div
      ref={composedRefs}
      // @ts-ignore `...style`, because its type differs from this style
      // for reasons we can ignore
      style={{
        // Preventing the page from jumping after we go empty state -> one/few notifs
        minHeight: notificationsInitiallyEmptyRef.current
          ? notificationWrapperContainerRef.current?.offsetHeight
          : undefined,
        ...style,
      }}
      className={classes.notificationList}
    >
      <div className={classes.notificationListHeader}>
        <p className={fontBodyEmphasis}>{t('notifications_title')}</p>
        <Button
          size="medium"
          buttonType="tertiary"
          icon="Checks"
          buttonAction="mark-all-as-read"
          onClick={onMarkAllAsReadClick}
          disabled={isNotificationListEmpty || !notifications}
          className={classes.markAllAsRead}
        >
          {t('mark_all_as_read_action')}
        </Button>
      </div>
      {loading && isNotificationListEmpty ? (
        <SpinnerCover size="3xl" />
      ) : (
        <NotificationListContents
          fetchAdditionalNotifications={increaseCountWanted}
        >
          {isNotificationListEmpty && showPlaceholder ? (
            <EmptyStateWithIcon
              title={t('empty_state_title')}
              subtext={t('empty_state_body')}
              iconName="Checks"
            />
          ) : (
            renderNotifications
          )}
        </NotificationListContents>
      )}
    </div>
  );
});

export function NotificationImpl({
  node,
  onClick,
}: {
  node: NotificationsNodeFragment;
  onClick?: NotificationReactComponentProps['onClick'];
}) {
  const { logWarning } = useLogger();

  if (!node.attachment) {
    return null;
  }

  switch (node.attachment.__typename) {
    case 'NotificationMessageAttachment':
      return (
        <SimpleMessageNotification
          notification={node}
          message={node.attachment.message}
          onClick={onClick}
        />
      );
    case 'NotificationURLAttachment':
      return (
        <SimpleURLNotification
          notification={node}
          url={node.attachment.url}
          onClick={onClick}
        />
      );
    case 'NotificationThreadAttachment':
      return (
        <SimpleThreadNotification
          notification={node}
          thread={node.attachment.thread}
          onClick={onClick}
        />
      );
    default:
      logWarning('unsupported-notifications-attachment-type');
      return null;
  }
}

export const newNotificationList = {
  NewComp: NotificationList,
  configKey: 'notificationList',
} as const;
