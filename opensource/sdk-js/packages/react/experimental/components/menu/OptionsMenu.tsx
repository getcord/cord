import * as React from 'react';
import { forwardRef, useCallback, useMemo, useState } from 'react';

import type { ClientMessageData } from '@cord-sdk/types';
import { DefaultTooltip } from '../WithTooltip.js';
import withCord from '../hoc/withCord.js';
import type { MandatoryReplaceableProps } from '../replacements.js';
import type { StyleProps } from '../../../experimental/types.js';
import * as classes from '../../../components/OptionsMenu.css.js';
import { useCordTranslation } from '../../../index.js';
import { MenuButton } from './MenuButton.js';
import type { MenuProps } from './Menu.js';
import { useMessageActions } from './MessageActions.js';
import { ShareToEmailFormWrapper } from './ShareToEmailForm.js';
import { SlackChannelsMenu } from './SlackChannelsMenu.js';
import { useThreadActions } from './ThreadActions.js';

export type MenuTypes =
  | 'actionsMenu'
  | 'slackChannelSelectMenu'
  | 'shareToEmailForm'
  | null;

export type OptionsMenuProps = {
  threadID: string;
  button: JSX.Element;
  disableTooltip?: boolean;
  markThreadAsRead?: (threadID: string) => void;
  showThreadOptions: boolean;
  showMessageOptions: boolean;
  message?: ClientMessageData;
  setEditing: React.Dispatch<React.SetStateAction<boolean>>;
} & StyleProps &
  MandatoryReplaceableProps;

export const OptionsMenu = withCord<React.PropsWithChildren<OptionsMenuProps>>(
  forwardRef(function OptionsMenu(
    props: OptionsMenuProps,
    _ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const {
      threadID,
      button,
      showThreadOptions,
      showMessageOptions,
      message,
      setEditing,
      ...restProps
    } = props;
    const [menuToShow, setMenuToShow] = useState<MenuTypes>(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const { t } = useCordTranslation('message');

    const handleOnClose = useCallback(() => {
      setMenuVisible(false);
      setMenuToShow(null);
    }, [setMenuVisible, setMenuToShow]);

    const handleOnShow = useCallback(() => {
      setMenuToShow((prev) => (prev ? null : 'actionsMenu'));
      setMenuVisible(true);
    }, [setMenuVisible, setMenuToShow]);

    const handleSetMenuVisible = useCallback(
      (visible: boolean) => {
        setMenuVisible(() => {
          if (visible) {
            handleOnShow();
          } else {
            handleOnClose();
          }
          return visible;
        });
      },
      [handleOnClose, handleOnShow, setMenuVisible],
    );

    const actionsMenuItems = useOptionsMenuActionsItems({
      threadID,
      showThreadOptions,
      showMessageOptions,
      handleOnClose,
      message,
      setEditing,
      setMenuToShow,
    });

    const menuItems = useMemo(() => {
      switch (menuToShow) {
        case 'slackChannelSelectMenu':
          return [
            {
              name: 'slack-channel-menu',
              element: (
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
              ),
            },
          ];
        case 'shareToEmailForm':
          return [
            {
              name: 'share-to-email-menu',
              element: (
                <div
                  key="share-to-email-menu"
                  className={classes.shareToEmailMenuContainer}
                >
                  <ShareToEmailFormWrapper
                    threadID={threadID}
                    onBackButtonClick={() => setMenuToShow('actionsMenu')}
                    onClose={handleOnClose}
                  />
                </div>
              ),
            },
          ];
        default:
          return actionsMenuItems;
      }
    }, [menuToShow, threadID, handleOnClose, actionsMenuItems]);

    const buttonLabel = t('message_options_tooltip');
    return (
      <MenuButton
        canBeReplaced
        menuVisible={menuVisible}
        menuItems={menuItems}
        buttonTooltipLabel={buttonLabel}
        button={button}
        setMenuVisible={handleSetMenuVisible}
        {...restProps}
      />
    );
  }),
  'OptionsMenu',
);

type UseOptionsMenuItems = {
  threadID: string;
  markThreadAsRead?: (threadID: string) => void;
  showMessageOptions: boolean;
  showThreadOptions: boolean;
  message?: ClientMessageData;
  setEditing: React.Dispatch<React.SetStateAction<boolean>>;
  handleOnClose: () => void;
  setMenuToShow: (menu: MenuTypes) => void;
};
export function useOptionsMenuActionsItems({
  threadID,
  setEditing,
  markThreadAsRead,
  message,
  showMessageOptions,
  showThreadOptions,
  handleOnClose,
  setMenuToShow,
}: UseOptionsMenuItems) {
  const threadActions = useThreadActions({
    closeMenu: handleOnClose,
    threadID,
    markThreadAsRead,
    setMenuToShow,
    message,
  });

  const messageActions = useMessageActions({
    showSeparator: showThreadOptions,
    closeMenu: handleOnClose,
    threadID: threadID,
    message: message,
    setEditing: setEditing,
  });
  return useMemo(() => {
    const items: MenuProps['items'] = [];
    if (showThreadOptions) {
      items.push(...threadActions);
    }

    if (!!message && !!showMessageOptions) {
      items.push(...messageActions);
    }
    return items;
  }, [
    message,
    showThreadOptions,
    showMessageOptions,
    threadActions,
    messageActions,
  ]);
}

export type OptionsMenuTooltipProps = object & MandatoryReplaceableProps;
export const OptionsMenuTooltip = withCord<
  React.PropsWithChildren<OptionsMenuTooltipProps>
>(
  forwardRef(function OptionsMenuTooltip(
    { 'data-cord-replace': dataCordReplace }: OptionsMenuTooltipProps,
    _ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { t } = useCordTranslation('message');
    return (
      <DefaultTooltip
        data-cord-replace={dataCordReplace}
        label={t('message_options_tooltip')}
      />
    );
  }),
  'OptionsMenuTooltip',
);
