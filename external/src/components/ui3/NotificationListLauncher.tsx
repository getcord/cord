import { useCallback, useEffect, useMemo, useState } from 'react';

import { NotificationList } from 'external/src/components/ui3/NotificationList.tsx';
import {
  cordCssVarName,
  getCordCSSVariableDefaultValue,
} from 'common/ui/cssVariables.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { Button } from 'external/src/components/ui3/Button.tsx';
import { usePopperCreator } from 'external/src/effects/usePopperCreator.ts';
import type { UsePopperCreatorProps } from 'external/src/effects/usePopperCreator.ts';
import type { NotificationListLauncherReactComponentProps } from '@cord-sdk/react';
import { useEscapeListener } from 'external/src/effects/useEscapeListener.ts';
import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';
import { DOCS_ORIGIN } from 'common/const/Urls.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { WithBadge } from 'external/src/components/ui3/WithBadge.tsx';
import { CordSDK } from 'sdk/client/core/index.tsx';
import { useNotificationCountsInternal } from '@cord-sdk/react/hooks/useNotificationSummaryInternal.ts';

function NotificationListLauncherButton({
  label = '',
  iconUrl,
  disabled,
  onClick,
  onClickNotification,
  maxCount,
  fetchAdditionalCount,
  showPlaceholder = true,
  filter,
}: NotificationListLauncherReactComponentProps) {
  const [notificationListOpen, setNotificationListOpen] = useState(false);
  const notificationSDK = CordSDK.get().notification;

  const notificationSummary = useNotificationCountsInternal(
    notificationSDK,
    true,
    filter,
  );

  const { logEvent } = useLogger();

  useEffect(() => {
    if (notificationListOpen) {
      const onPageClick = () => {
        setNotificationListOpen(false);
      };
      document.addEventListener('click', onPageClick);
      return () => document.removeEventListener('click', onPageClick);
    }
    return;
  }, [notificationListOpen]);

  useEscapeListener(
    () => setNotificationListOpen(false),
    !notificationListOpen, // disable if not open
  );

  const icon = useMemo(() => {
    if (iconUrl === null || iconUrl === undefined) {
      return 'Bell' as const;
    }

    if (iconUrl === '') {
      return undefined;
    }

    try {
      return new URL(iconUrl);
    } catch {
      console.error(`NotificationListLauncher: Invalid URL: ${iconUrl}`);
      return undefined;
    }
  }, [iconUrl]);

  const onButtonClick = useCallback<React.MouseEventHandler>(
    (e) => {
      e.stopPropagation();
      setNotificationListOpen(!notificationListOpen);
      onClick?.();
      logEvent('notification-list-launcher-clicked');
    },
    [logEvent, notificationListOpen, onClick],
  );

  // Grab the value of --cord-notification-list-launcher-offset every time the popup
  // opens or closes, and pass it to the popper creator as 'offset'
  const element = useContextThrowingIfNoProvider(ComponentContext)?.element;
  const offset = useMemo(() => {
    if (!element) {
      return 0;
    }
    let value = window
      .getComputedStyle(element)
      .getPropertyValue(cordCssVarName('notification-list-launcher-offset'));

    if (value === '') {
      value = getCordCSSVariableDefaultValue(
        'notification-list-launcher-offset',
      );
    }

    const number = parseInt(value);
    if (isNaN(number)) {
      return 0;
    }

    return number;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationListOpen, element]);

  const popperCreatorConfig: UsePopperCreatorProps = useMemo(() => {
    if (window.location.origin === DOCS_ORIGIN) {
      return {
        offset,
        popperStrategy: 'absolute',
        popperPosition: 'bottom',
        allowFlip: false,
      };
    }
    return { offset };
  }, [offset]);

  const {
    styles: popperStyles,
    setReferenceElement,
    setPopperElement,
  } = usePopperCreator(popperCreatorConfig);

  const button = (
    <Button
      buttonType="secondary"
      size="medium"
      icon={icon}
      onClick={onButtonClick}
      disabled={disabled}
      ref={setReferenceElement}
      buttonAction="open-notification-list"
    >
      {label}
    </Button>
  );

  return (
    <>
      {notificationSummary && notificationSummary.unread > 0 ? (
        <WithBadge count={notificationSummary.unread}>{button}</WithBadge>
      ) : (
        button
      )}
      {notificationListOpen && (
        <NotificationList
          ref={setPopperElement}
          style={popperStyles}
          maxCount={maxCount}
          fetchAdditionalCount={fetchAdditionalCount}
          internalHostStyles={false}
          showPlaceholder={showPlaceholder}
          filter={filter}
          onClickNotification={onClickNotification}
        />
      )}
    </>
  );
}

export const newNotificationListLauncher = {
  NewComp: NotificationListLauncherButton,
  configKey: 'notificationListLauncher',
} as const;
