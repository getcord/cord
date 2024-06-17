import { memo, useMemo } from 'react';

import type { BadgeStyle } from '@cord-sdk/types';
import type { SidebarLauncherReactComponentProps } from '@cord-sdk/react';

import { useSidebarVisibleSDK } from 'sdk/client/core/react/useSidebarVisibleSDK.ts';
import { InboxProvider } from 'external/src/context/inbox/InboxProvider.tsx';
import { InboxContext } from 'external/src/context/inbox/InboxContext.ts';
import type { Button2CSSVariablesOverride } from 'external/src/components/ui2/Button2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { WithBadge2 } from 'external/src/components/ui2/WithBadge2.tsx';
import type { Badge2CSSVariablesOverride } from 'external/src/components/ui2/Badge2.tsx';
import { WithNotificationMessage2 } from 'external/src/components/2/WithNotificationMessage2.tsx';
import { ACTIVATION_FIRST_MESSAGE_SENT } from 'common/const/UserPreferenceKeys.ts';
import { usePreference } from 'external/src/effects/usePreference.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { DisabledCSSVariableOverrideContextProvider } from 'external/src/context/cssVariableOverride/CSSVariableOverrideContext.tsx';

const DEFAULT_BADGE_STYLE: BadgeStyle = 'badge_with_count';
const DEFAULT_LABEL = 'Comment';

function SidebarLauncher(props: SidebarLauncherReactComponentProps) {
  return (
    <DisabledCSSVariableOverrideContextProvider>
      <InboxProvider>
        <SidebarLauncherButton {...props} />
      </InboxProvider>
    </DisabledCSSVariableOverrideContextProvider>
  );
}

const CSS_VARIABLES: Button2CSSVariablesOverride = {
  fontSize: 'sidebar-launcher-font-size',
  lineHeight: 'sidebar-launcher-line-height',
  letterSpacing: 'sidebar-launcher-letter-spacing',
  color: 'sidebar-launcher-text-color',
  colorHover: 'sidebar-launcher-text-color--hover',
  colorActive: 'sidebar-launcher-text-color--active',
  colorDisabled: 'sidebar-launcher-text-color--disabled',
  backgroundColor: 'sidebar-launcher-background-color',
  backgroundColorHover: 'sidebar-launcher-background-color--hover',
  backgroundColorActive: 'sidebar-launcher-background-color--active',
  backgroundColorDisabled: 'sidebar-launcher-background-color--disabled',
  padding: 'sidebar-launcher-padding',
  gap: 'sidebar-launcher-gap',
  iconSize: 'sidebar-launcher-icon-size',
  height: 'sidebar-launcher-height',
  border: 'sidebar-launcher-border',
};

const INBOX_CSS_VARIABLES: Badge2CSSVariablesOverride = {
  backgroundColor: 'sidebar-launcher-badge-background-color',
  textColor: 'sidebar-launcher-badge-text-color',
};

function SidebarLauncherButton({
  disabled = false,
  label,
  inboxBadgeStyle = DEFAULT_BADGE_STYLE,
  iconUrl,
  onClick,
}: SidebarLauncherReactComponentProps) {
  const [sidebarVisible, setSidebarVisible] = useSidebarVisibleSDK();
  const { count: inboxCount } = useContextThrowingIfNoProvider(InboxContext);

  const [viewerFirstMessageSent] = usePreference<boolean>(
    ACTIVATION_FIRST_MESSAGE_SENT,
  );
  const icon = useMemo(() => {
    if (iconUrl === null || iconUrl === undefined) {
      return 'ChatAdd' as const;
    }

    if (iconUrl === '') {
      return undefined;
    }

    try {
      return new URL(iconUrl);
    } catch {
      console.error(`SidebarLauncher: Invalid URL: ${iconUrl}`);
      return undefined;
    }
  }, [iconUrl]);

  const button = (
    <Button2
      buttonType="secondary"
      disabled={disabled}
      size="medium"
      icon={icon}
      cssVariablesOverride={CSS_VARIABLES}
      onClick={() => {
        setSidebarVisible(!sidebarVisible);
        onClick?.();
      }}
    >
      {label === null ? '' : label ?? DEFAULT_LABEL}
    </Button2>
  );

  const showInboxBadge = inboxBadgeStyle !== 'none' && inboxCount > 0;

  if (!viewerFirstMessageSent && !disabled) {
    return (
      <WithNotificationMessage2 notificationType="sidebarLauncher">
        {button}
      </WithNotificationMessage2>
    );
  }

  if (showInboxBadge && !disabled) {
    return (
      <WithBadge2
        style={inboxBadgeStyle}
        count={inboxCount}
        cssVariablesOverride={INBOX_CSS_VARIABLES}
      >
        {button}
      </WithBadge2>
    );
  }
  return button;
}

// TODO: make this automatic
export default memo(SidebarLauncher);
