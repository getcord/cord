import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { createUseStyles } from 'react-jss';
import type { BadgeStyle } from '@cord-sdk/types';
import type { InboxLauncherReactComponentProps } from '@cord-sdk/react';

import { InboxProvider } from 'external/src/context/inbox/InboxProvider.tsx';
import { InboxContext } from 'external/src/context/inbox/InboxContext.ts';
import type { Button2CSSVariablesOverride } from 'external/src/components/ui2/Button2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { WithBadge2 } from 'external/src/components/ui2/WithBadge2.tsx';
import type { Badge2CSSVariablesOverride } from 'external/src/components/ui2/Badge2.tsx';
import type { UsePopperCreatorProps } from 'external/src/effects/usePopperCreator.ts';
import { usePopperCreator } from 'external/src/effects/usePopperCreator.ts';
import {
  cordCssVarName,
  cssVar,
  cssVarWithCustomFallback,
  CSS_VAR_CUSTOM_FALLBACKS,
  getCordCSSVariableDefaultValue,
} from 'common/ui/cssVariables.ts';
import Inbox, { INBOX_HOST_STYLE } from 'sdk/client/core/react/Inbox.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';
import { DOCS_ORIGIN } from 'common/const/Urls.ts';
import { DisabledAnnotationsOnPageProvider } from 'external/src/context/annotationsOnPage/AnnotationsOnPageProvider.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { PagePresenceAndVisitorsShim } from 'sdk/client/core/react/PagePresenceAndVisitorsShim.tsx';

const DEFAULT_BADGE_STYLE: BadgeStyle = 'badge_with_count';
const DEFAULT_LABEL = 'Inbox';

function InboxLauncher(props: InboxLauncherReactComponentProps) {
  return (
    <InboxProvider>
      <InboxLauncherButton {...props} />
    </InboxProvider>
  );
}

const CSS_VARIABLES: Button2CSSVariablesOverride = {
  fontSize: 'inbox-launcher-font-size',
  color: 'inbox-launcher-text-color',
  colorHover: 'inbox-launcher-text-color--hover',
  colorActive: 'inbox-launcher-text-color--active',
  colorDisabled: 'inbox-launcher-text-color--disabled',
  backgroundColor: 'inbox-launcher-background-color',
  backgroundColorHover: 'inbox-launcher-background-color--hover',
  backgroundColorActive: 'inbox-launcher-background-color--active',
  backgroundColorDisabled: 'inbox-launcher-background-color--disabled',
  padding: 'inbox-launcher-padding',
  gap: 'inbox-launcher-gap',
  iconSize: 'inbox-launcher-icon-size',
  height: 'inbox-launcher-height',
  border: 'inbox-launcher-border',
};

const INBOX_LAUNCHER_CSS_VARIABLES: Badge2CSSVariablesOverride = {
  backgroundColor: 'inbox-launcher-badge-background-color',
  textColor: 'inbox-launcher-badge-text-color',
};

const useStyles = createUseStyles({
  // The inbox component sets styles on :host and :host > div, we need to set
  // those same styles on two divs with the same structure to get it to look
  // correct
  inboxHostStandin: {
    ...INBOX_HOST_STYLE['@global'][':host, cord-inbox'],
    zIndex: cssVar('inbox-launcher-inbox-z-index'),
    boxShadow: cssVar('inbox-launcher-inbox-box-shadow'),
    height: cssVarWithCustomFallback(
      'inbox-height',
      CSS_VAR_CUSTOM_FALLBACKS.NESTED_INBOX.height,
    ),
    width: cssVarWithCustomFallback(
      'inbox-width',
      CSS_VAR_CUSTOM_FALLBACKS.NESTED_INBOX.width,
    ),
  },
  inboxHostInnerDivStandin:
    INBOX_HOST_STYLE['@global'][':host > div, cord-inbox'],
});

function InboxLauncherButton({
  label,
  inboxBadgeStyle = DEFAULT_BADGE_STYLE,
  iconUrl,
  showInboxOnClick = true,
  onClick,
  showSettings = true,
  showPlaceholder = true,
  disabled,
}: InboxLauncherReactComponentProps) {
  const [inboxOpen, setInboxOpen] = useState(false);
  const { count: inboxCount } = useContextThrowingIfNoProvider(InboxContext);

  const classes = useStyles();

  const { logEvent } = useLogger();

  const icon = useMemo(() => {
    if (iconUrl === null || iconUrl === undefined) {
      return 'Tray' as const;
    }

    if (iconUrl === '') {
      return undefined;
    }

    try {
      return new URL(iconUrl);
    } catch {
      console.error(`InboxLauncher: Invalid URL: ${iconUrl}`);
      return undefined;
    }
  }, [iconUrl]);

  const onClose = useCallback(() => setInboxOpen(false), []);

  const onButtonClick = useCallback<React.MouseEventHandler>(
    (e) => {
      if (showInboxOnClick) {
        e.stopPropagation();
        // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        setInboxOpen((inboxOpen) => !inboxOpen);
        logEvent('sdk-inbox-launcher-modal-opened');
      }
      onClick?.();
      logEvent('sdk-inbox-launcher-clicked');
    },
    [onClick, showInboxOnClick, logEvent],
  );

  // Grab the value of --cord-inbox-launcher-inbox-offset every time the popup
  // opens or closes, and pass it to the popper creator as 'offset'
  const element = useContextThrowingIfNoProvider(ComponentContext)?.element;
  const offset = useMemo(() => {
    if (!element) {
      return 0;
    }
    let value = window
      .getComputedStyle(element)
      .getPropertyValue(cordCssVarName('inbox-launcher-inbox-offset'));

    if (value === '') {
      value = getCordCSSVariableDefaultValue('inbox-launcher-inbox-offset');
    }

    const number = parseInt(value);
    if (isNaN(number)) {
      return 0;
    }

    return number;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inboxOpen, element]);

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
    <Button2
      disabled={disabled}
      buttonType="secondary"
      size="medium"
      icon={icon}
      cssVariablesOverride={CSS_VARIABLES}
      onClick={onButtonClick}
      ref={setReferenceElement}
    >
      {label ?? DEFAULT_LABEL}
    </Button2>
  );

  useEffect(() => {
    if (inboxOpen) {
      const onPageClick = () => {
        setInboxOpen(false);
      };
      document.addEventListener('click', onPageClick);
      return () => document.removeEventListener('click', onPageClick);
    }
    return undefined;
  }, [inboxOpen]);

  return (
    <DisabledAnnotationsOnPageProvider>
      <PagePresenceAndVisitorsShim>
        {inboxBadgeStyle !== 'none' && inboxCount > 0 ? (
          <WithBadge2
            style={inboxBadgeStyle}
            count={inboxCount}
            cssVariablesOverride={INBOX_LAUNCHER_CSS_VARIABLES}
          >
            {button}
          </WithBadge2>
        ) : (
          button
        )}
        {inboxOpen && (
          <div
            ref={setPopperElement}
            className={classes.inboxHostStandin}
            style={popperStyles}
            onClick={(e) => e.stopPropagation()} // so you can still click on the Inbox itself without it closing
          >
            <div className={classes.inboxHostInnerDivStandin}>
              <Inbox
                onCloseRequested={onClose}
                showSettings={showSettings}
                internalHostStyles={false}
                showPlaceholder={showPlaceholder}
              />
            </div>
          </div>
        )}
      </PagePresenceAndVisitorsShim>
    </DisabledAnnotationsOnPageProvider>
  );
}

// TODO: make this automatic
export default memo(InboxLauncher);
