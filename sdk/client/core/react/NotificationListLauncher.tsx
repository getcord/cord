import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createUseStyles } from 'react-jss';

import {
  NotificationList,
  NOTIFICATION_LIST_HOST_STYLE,
} from 'sdk/client/core/react/NotificationList.tsx';
import {
  cordCssVarName,
  cssVar,
  cssVarWithCustomFallback,
  CSS_VAR_CUSTOM_FALLBACKS,
  getCordCSSVariableDefaultValue,
} from 'common/ui/cssVariables.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import type { Button2CSSVariablesOverride } from 'external/src/components/ui2/Button2.tsx';
import { usePopperCreator } from 'external/src/effects/usePopperCreator.ts';
import type { UsePopperCreatorProps } from 'external/src/effects/usePopperCreator.ts';
import type { NotificationListLauncherReactComponentProps } from '@cord-sdk/react';
import { useEscapeListener } from 'external/src/effects/useEscapeListener.ts';
import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';
import { DOCS_ORIGIN } from 'common/const/Urls.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import type { BadgeStyle } from '@cord-sdk/types';
import { WithBadge2 } from 'external/src/components/ui2/WithBadge2.tsx';
import type { Badge2CSSVariablesOverride } from 'external/src/components/ui2/Badge2.tsx';
import { CordSDK } from 'sdk/client/core/index.tsx';
import { useNotificationCountsInternal } from '@cord-sdk/react/hooks/useNotificationSummaryInternal.ts';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';
import { newNotificationListLauncher } from 'external/src/components/ui3/NotificationListLauncher.tsx';
import { logDeprecatedCall } from 'sdk/client/core/cordAPILogger.ts';

const DEFAULT_BADGE_STYLE: BadgeStyle = 'badge_with_count';

const CSS_VARIABLES: Button2CSSVariablesOverride = {
  fontSize: 'notification-list-launcher-font-size',
  color: 'notification-list-launcher-text-color',
  colorHover: 'notification-list-launcher-text-color--hover',
  colorActive: 'notification-list-launcher-text-color--active',
  colorDisabled: 'notification-list-launcher-text--disabled',
  backgroundColor: 'notification-list-launcher-background-color',
  backgroundColorHover: 'notification-list-launcher-background-color--hover',
  backgroundColorActive: 'notification-list-launcher-background-color--active',
  backgroundColorDisabled:
    'notification-list-launcher-background-color--disabled',
  padding: 'notification-list-launcher-padding',
  gap: 'notification-list-launcher-gap',
  iconSize: 'notification-list-launcher-icon-size',
  height: 'notification-list-launcher-height',
  border: 'notification-list-launcher-border',
};

const NOTIFICATION_LIST_LAUNCHER_BADGE_CSS_VARIABLES: Badge2CSSVariablesOverride =
  {
    backgroundColor: 'notification-list-launcher-badge-background-color',
    textColor: 'notification-list-launcher-badge-text-color',
  };

export const NotificationListLauncher = withNewCSSComponentMaybe(
  newNotificationListLauncher,
  function NotificationListLauncher(
    props: NotificationListLauncherReactComponentProps,
  ) {
    return <NotificationListLauncherButton {...props} />;
  },
);

const useStyles = createUseStyles({
  notificationListStandin: {
    ...NOTIFICATION_LIST_HOST_STYLE['@global'][':host'],
    height: cssVarWithCustomFallback(
      'notification-list-height',
      CSS_VAR_CUSTOM_FALLBACKS.NESTED_NOTIFICATION_LIST.height,
    ),
    width: cssVarWithCustomFallback(
      'notification-list-width',
      CSS_VAR_CUSTOM_FALLBACKS.NESTED_NOTIFICATION_LIST.width,
    ),
    zIndex: cssVar('notification-list-launcher-list-z-index'),
  },
  notificationListInnerDivStandin:
    NOTIFICATION_LIST_HOST_STYLE['@global'][':host > div'],
});

function NotificationListLauncherButton({
  label = '',
  iconUrl,
  badgeStyle = DEFAULT_BADGE_STYLE,
  disabled,
  onClick,
  maxCount,
  fetchAdditionalCount,
  showPlaceholder = true,
  filter = undefined,
}: NotificationListLauncherReactComponentProps) {
  const [notificationListOpen, setNotificationListOpen] = useState(false);
  const classes = useStyles();
  const notificationSDK = CordSDK.get().notification;

  const notificationSummary = useNotificationCountsInternal(
    notificationSDK,
    true,
    filter,
  );

  if (filter?.organizationID) {
    logDeprecatedCall('NotificationsListLauncher:organizationID');
  }

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
    // TODO (notifications) add component to docs site
    // add unpublished docs
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
    <Button2
      buttonType="secondary"
      size="medium"
      icon={icon}
      onClick={onButtonClick}
      disabled={disabled}
      ref={setReferenceElement}
      cssVariablesOverride={CSS_VARIABLES}
    >
      {label}
    </Button2>
  );

  return (
    <>
      {badgeStyle !== 'none' &&
      notificationSummary &&
      notificationSummary.unread > 0 ? (
        <WithBadge2
          style={badgeStyle}
          count={notificationSummary.unread}
          cssVariablesOverride={NOTIFICATION_LIST_LAUNCHER_BADGE_CSS_VARIABLES}
        >
          {button}
        </WithBadge2>
      ) : (
        button
      )}
      {notificationListOpen && (
        <div
          ref={setPopperElement}
          className={classes.notificationListStandin}
          style={popperStyles}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={classes.notificationListInnerDivStandin}>
            <NotificationList
              maxCount={maxCount}
              fetchAdditionalCount={fetchAdditionalCount}
              internalHostStyles={false}
              showPlaceholder={showPlaceholder}
              filter={filter}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default memo(NotificationListLauncher);
