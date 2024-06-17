import { memo, useCallback, useMemo, useState } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { useCordTranslation } from '@cord-sdk/react';
import { ThreadActions } from 'external/src/components/2/ThreadActions.tsx';
import type { UUID } from 'common/types/index.ts';
import { SlackChannelSelectMenu2 } from 'external/src/components/2/SlackChannelSelectMenu2.tsx';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { BoxWithPopper2 } from 'external/src/components/ui2/BoxWithPopper2.tsx';
import { ShareToEmailMenu2 } from 'external/src/components/ShareToEmailMenu2.tsx';
import { ZINDEX } from 'common/ui/zIndex.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { Menu2 } from 'external/src/components/ui2/Menu2.tsx';
import { MessageActions } from 'external/src/components/2/MessageActions.tsx';
import type { MessageFragment } from 'external/src/graphql/operations.ts';
import { MenuItem2 } from 'external/src/components/ui2/MenuItem2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { DebugInfo2 } from 'external/src/components/2/DebugInfo2.tsx';
import { usePreference } from 'external/src/effects/usePreference.ts';
import { ENABLE_THREAD_DEBUG } from 'common/const/UserPreferenceKeys.ts';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';
import { newOptionsMenuConfig } from 'external/src/components/ui3/OptionsMenu.tsx';
import { useIsSlackConnected } from 'external/src/effects/useIsSlackConnected.ts';

const SHARE_TO_EMAIL_MENU_WIDTH = 190;
const SLACK_CHANNEL_SELECT_MENU_HEIGHT = 400;
const SLACK_CHANNEL_SELECT_MENU_WIDTH = 200;

const useStyles = createUseStyles({
  slackChannelSelectMenuContainer: {
    display: 'flex',
    maxHeight: SLACK_CHANNEL_SELECT_MENU_HEIGHT,
    maxWidth: SLACK_CHANNEL_SELECT_MENU_WIDTH,
    overflow: 'hidden',
  },
  optionsMenu: {
    zIndex: ZINDEX.popup,
  },
  shareToEmailMenuContainer: {
    maxWidth: SHARE_TO_EMAIL_MENU_WIDTH,
  },
});

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
};

export const OptionsMenu = memo(
  withNewCSSComponentMaybe(
    newOptionsMenuConfig,
    function OptionsMenu({
      threadID,
      button,
      disableTooltip = false,
      getClassName,
      markThreadAsRead,
      setMenuShowing,
      showThreadOptions,
      showMessageOptions,
      message,
    }: Props) {
      const { t } = useCordTranslation('message');
      const classes = useStyles();
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
                <Menu2>
                  {showThreadOptions && (
                    <ThreadActions
                      key="thread-actions-menu"
                      threadID={threadID}
                      closeMenu={handleOnClose}
                      showSlackChannelSelectMenu={() =>
                        setMenuToShow('slackChannelSelectMenu')
                      }
                      showShareToEmailMenu={() =>
                        setMenuToShow('shareToEmailMenu')
                      }
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
                    />
                  )}
                  {!!threadDebugEnabled && (
                    <MenuItem2
                      // eslint-disable-next-line i18next/no-literal-string
                      label="Debug"
                      leftItem={<Icon2 name="Code" size="large" />}
                      onClick={(event) => {
                        event.stopPropagation();
                        setDebugging(true);
                      }}
                    />
                  )}
                </Menu2>
                {debugging && (
                  <DebugInfo2
                    message={message}
                    close={() => setDebugging(false)}
                  />
                )}
              </>
            );
          case 'slackChannelSelectMenu':
            return (
              <Box2
                key="slack-channel-select-menu"
                className={classes.slackChannelSelectMenuContainer}
              >
                <SlackChannelSelectMenu2
                  onBackButtonClick={() => setMenuToShow('actionsMenu')}
                  onClose={handleOnClose}
                  threadID={threadID}
                />
              </Box2>
            );
          case 'shareToEmailMenu':
            return (
              <Box2
                key="share-to-email-menu"
                className={classes.shareToEmailMenuContainer}
              >
                <ShareToEmailMenu2
                  threadID={threadID}
                  onBackButtonClick={() => setMenuToShow('actionsMenu')}
                  onClose={handleOnClose}
                />
              </Box2>
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
        threadDebugEnabled,
        debugging,
        classes.slackChannelSelectMenuContainer,
        classes.shareToEmailMenuContainer,
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
        <WithTooltip2
          label={t('message_options_tooltip')}
          tooltipDisabled={menuVisible || disableTooltip}
        >
          <BoxWithPopper2
            className={cx(classes.optionsMenu, getClassName?.(menuVisible))}
            popperElement={popperElement}
            popperElementVisible={menuVisible}
            popperPosition="bottom-end"
            onShouldHide={hideMenu}
            onClick={onClick}
            withBlockingOverlay={true}
          >
            {button}
          </BoxWithPopper2>
        </WithTooltip2>
      );
    },
  ),
);
