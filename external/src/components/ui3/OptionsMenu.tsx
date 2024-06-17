import type { RefObject } from 'react';
import { useCallback, useMemo, useState } from 'react';
import cx from 'classnames';

import { useCordTranslation } from '@cord-sdk/react';
import { ThreadActions } from 'external/src/components/ui3/thread/ThreadActions.tsx';
import type { UUID } from 'common/types/index.ts';
import { ShareToEmailMenu } from 'external/src/components/ui3/ShareToEmailMenu.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { WithTooltip } from 'external/src/components/ui3/WithTooltip.tsx';
import { Menu } from 'external/src/components/ui3/Menu.tsx';
import { MessageActions } from 'external/src/components/ui3/MessageActions.tsx';
import type { MessageFragment } from 'external/src/graphql/operations.ts';
import { MenuItem } from 'external/src/components/ui3/MenuItem.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { DebugInfo2 } from 'external/src/components/2/DebugInfo2.tsx';
import { usePreference } from 'external/src/effects/usePreference.ts';
import { ENABLE_THREAD_DEBUG } from 'common/const/UserPreferenceKeys.ts';
import { WithPopper } from 'external/src/components/ui3/WithPopper.tsx';
import { SlackChannelsMenu } from 'external/src/components/ui3/SlackChannelsMenu.tsx';
import { useIsSlackConnected } from 'external/src/effects/useIsSlackConnected.ts';
import * as classes from 'external/src/components/ui3/OptionsMenu.css.ts';

type MenuTypes =
  | 'actionsMenu'
  | 'slackChannelSelectMenu'
  | 'shareToEmailMenu'
  | null;

type Props = {
  threadID: UUID;
  button: JSX.Element;
  disableTooltip?: boolean;
  getClassName?: (menuVisible: boolean) => string;
  markThreadAsRead?: (threadID: string) => void;
  setMenuShowing?: (state: boolean) => void;
  showThreadOptions: boolean;
  showMessageOptions: boolean;
  message?: MessageFragment;
  messageRef?: RefObject<HTMLDivElement>;
};

export const OptionsMenu = ({
  threadID,
  button,
  disableTooltip = false,
  getClassName,
  markThreadAsRead,
  setMenuShowing,
  showThreadOptions,
  showMessageOptions,
  message,
  messageRef,
}: Props) => {
  const { t } = useCordTranslation('message');
  const [menuToShow, setMenuToShow] = useState<MenuTypes>(null);

  const { logEvent } = useLogger();
  const { isOrgConnected } = useIsSlackConnected();

  const [threadDebugEnabled] = usePreference(ENABLE_THREAD_DEBUG);
  const [debugging, setDebugging] = useState(false);

  const handleOnClose = useCallback(() => {
    setMenuShowing?.(false);
    setMenuToShow(null);
  }, [setMenuShowing]);

  const popperElement = useMemo(() => {
    switch (menuToShow) {
      case 'actionsMenu':
        return (
          <>
            <Menu>
              {showThreadOptions && (
                <ThreadActions
                  key="thread-actions-menu"
                  threadID={threadID}
                  closeMenu={handleOnClose}
                  showSlackChannelSelectMenu={() =>
                    setMenuToShow('slackChannelSelectMenu')
                  }
                  showShareToEmailMenu={() => setMenuToShow('shareToEmailMenu')}
                  markThreadAsRead={markThreadAsRead}
                  isSlackWorkspaceConnected={isOrgConnected}
                />
              )}
              {!!message && !!showMessageOptions && (
                <MessageActions
                  showSeparator={showThreadOptions}
                  closeMenu={handleOnClose}
                  threadID={threadID}
                  message={message}
                  messageRef={messageRef}
                />
              )}
              {!!threadDebugEnabled && (
                <MenuItem
                  menuItemAction={'thread-debug'}
                  // eslint-disable-next-line i18next/no-literal-string
                  label="Debug"
                  leftItem={<Icon2 name="Code" size="large" />}
                  onClick={(event) => {
                    event.stopPropagation();
                    setDebugging(true);
                  }}
                />
              )}
            </Menu>
            {debugging && (
              <DebugInfo2 message={message} close={() => setDebugging(false)} />
            )}
          </>
        );
      case 'slackChannelSelectMenu':
        return (
          <div
            key="slack-channel-menu"
            className={classes.slackChannelSelectMenuContainer}
          >
            <SlackChannelsMenu
              onBackButtonClick={() => setMenuToShow('actionsMenu')}
              onClose={handleOnClose}
              threadID={threadID}
            />
          </div>
        );
      case 'shareToEmailMenu':
        return (
          <div
            key="share-to-email-menu"
            className={classes.shareToEmailMenuContainer}
          >
            <ShareToEmailMenu
              threadID={threadID}
              onBackButtonClick={() => setMenuToShow('actionsMenu')}
              onClose={handleOnClose}
            />
          </div>
        );
      default:
        return null;
    }
  }, [
    menuToShow,
    showThreadOptions,
    threadID,
    handleOnClose,
    markThreadAsRead,
    isOrgConnected,
    message,
    showMessageOptions,
    messageRef,
    threadDebugEnabled,
    debugging,
  ]);

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      logEvent('click-message-options-menu', {
        thread: showThreadOptions,
        message: !!message,
      });
      setMenuToShow((prev) => (prev ? null : 'actionsMenu'));
      setMenuShowing?.(true);
    },
    [logEvent, message, setMenuShowing, showThreadOptions],
  );

  const menuVisible = Boolean(menuToShow);

  const hideMenu = useCallback(() => {
    setMenuToShow(null);
    setMenuShowing?.(false);
  }, [setMenuShowing]);

  return (
    <WithTooltip
      label={t('message_options_tooltip')}
      tooltipDisabled={menuVisible || disableTooltip}
    >
      <WithPopper
        className={cx(classes.optionsMenu, getClassName?.(menuVisible))}
        popperElement={popperElement}
        popperElementVisible={menuVisible}
        popperPosition="bottom-end"
        onShouldHide={hideMenu}
        onClick={onClick}
        withBlockingOverlay={true}
      >
        {button}
      </WithPopper>
    </WithTooltip>
  );
};

export const newOptionsMenuConfig = {
  NewComp: OptionsMenu,
  configKey: 'optionsMenu',
} as const;
