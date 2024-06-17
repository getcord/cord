import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { jss } from 'react-jss';

import { useCordTranslation } from '@cord-sdk/react';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { ErrorHandler } from 'external/src/logging/ErrorHandler.tsx';
import { SimpleMessageNotification } from 'external/src/components/notifications/SimpleMessageNotification.tsx';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { SpinnerCover } from 'external/src/components/SpinnerCover.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { NotificationsListContext } from 'external/src/context/notifications/NotificationsContext.tsx';
import { SimpleURLNotification } from 'external/src/components/notifications/SimpleURLNotification.tsx';
import { NotificationListContents } from 'external/src/context/notifications/NotificationListContents.tsx';
import type { NotificationListReactComponentProps } from '@cord-sdk/react';
import { EmptyStateWithIcon } from 'external/src/components/2/EmptyStateWithIcon.tsx';
import { DisabledCSSVariableOverrideContextProvider } from 'external/src/context/cssVariableOverride/CSSVariableOverrideContext.tsx';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';
import { newNotificationList } from 'external/src/components/ui3/NotificationList.tsx';
import type { NotificationsNodeFragment } from 'external/src/graphql/operations.ts';
import { NotificationsListProvider } from 'external/src/context/notifications/NotificationsListProvider.tsx';
import { logDeprecatedCall } from 'sdk/client/core/cordAPILogger.ts';

export const NOTIFICATION_LIST_HOST_STYLE = {
  '@global': {
    ':host': {
      backgroundColor: cssVar('notification-list-background-color'),
      border: cssVar('notification-list-border'),
      borderRadius: cssVar('notification-list-border-radius'),
      boxShadow: cssVar('notification-list-box-shadow'),
      display: 'block',
      height: cssVar('notification-list-height'),
      width: cssVar('notification-list-width'),
      minWidth: '250px',
      overflow: 'hidden',
    },
    ':host > div': {
      display: 'flex',
      flexDirection: 'column',
      height: ' 100%',
      isolation: 'isolate',
      maxHeight: 'inherit',
      position: 'relative',
    },
  },
};

export const NotificationList = withNewCSSComponentMaybe(
  newNotificationList,
  function NotificationList({
    maxCount = 10,
    fetchAdditionalCount = maxCount,
    internalHostStyles = true,
    showPlaceholder = true,
    filter = undefined,
  }: NotificationListReactComponentProps & {
    internalHostStyles?: boolean;
  }) {
    // TODO (notifications) Look into moving this to a top level const
    // so it is only run once when the SDK is loaded and cached
    const notificationListStyles = useMemo(
      () => jss.createStyleSheet(NOTIFICATION_LIST_HOST_STYLE).toString(),
      [],
    );

    if (filter?.organizationID) {
      logDeprecatedCall('NotificationsList:organizationID');
    }

    return (
      <DisabledCSSVariableOverrideContextProvider>
        <NotificationsListProvider firstLoadCount={maxCount} filter={filter}>
          {internalHostStyles && <style>{notificationListStyles}</style>}
          <NotificationListImpl
            maxCount={maxCount}
            fetchAdditionalCount={fetchAdditionalCount}
            showPlaceholder={showPlaceholder}
          />
        </NotificationsListProvider>
      </DisabledCSSVariableOverrideContextProvider>
    );
  },
);

function NotificationListImpl({
  maxCount,
  fetchAdditionalCount,
  showPlaceholder,
}: Required<
  Pick<
    NotificationListReactComponentProps,
    'maxCount' | 'fetchAdditionalCount' | 'showPlaceholder'
  >
>) {
  const { t } = useCordTranslation('notifications');
  const {
    notifications,
    loading,
    hasMore,
    fetchAdditionalNotifications,
    markAllNotificationsAsRead,
  } = useContextThrowingIfNoProvider(NotificationsListContext);

  const [countWanted, setCountWanted] = useState(maxCount);
  const increaseCountWanted = useCallback(() => {
    if (!loading) {
      setCountWanted((n) => n + fetchAdditionalCount);
    }
  }, [fetchAdditionalCount, loading]);

  const notificationNodes = useMemo(
    () => notifications.slice(0, countWanted),
    [countWanted, notifications],
  );

  useEffect(() => {
    if (!loading && hasMore && countWanted > notificationNodes.length) {
      void fetchAdditionalNotifications(countWanted - notificationNodes.length);
    }
  }, [
    countWanted,
    fetchAdditionalNotifications,
    hasMore,
    loading,
    notificationNodes.length,
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
            <NotificationImpl node={node} />
          </ErrorHandler>
        );
      }),
    [notificationNodes],
  );

  return (
    <div
      ref={notificationWrapperContainerRef}
      style={{
        display: 'flex',
        height: '100%',
        flexDirection: 'column',
        maxHeight: 'inherit',
        // Preventing the page from jumping after we go empty state -> one/few notifs
        minHeight: notificationsInitiallyEmptyRef.current
          ? notificationWrapperContainerRef.current?.offsetHeight
          : undefined,
      }}
    >
      <Row2 paddingLeft="m" paddingRight="2xs" paddingVertical="2xs">
        <Text2 color="brand-primary" font="body-emphasis">
          {t('notifications_title')}
        </Text2>
        <Button2
          size="medium"
          buttonType="tertiary"
          icon="Checks"
          onClick={onMarkAllAsReadClick}
          marginLeft="auto"
          disabled={isNotificationListEmpty || !notifications}
        >
          {t('mark_all_as_read_action')}
        </Button2>
      </Row2>
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
}

function NotificationImpl({ node }: { node: NotificationsNodeFragment }) {
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
        />
      );
    case 'NotificationURLAttachment':
      return (
        <SimpleURLNotification notification={node} url={node.attachment.url} />
      );
    default:
      logWarning('unsupported-notifications-attachment-type');
      return null;
  }
}

// TODO: make this automatic
export default memo(NotificationList);
