import * as React from 'react';
import { forwardRef, useCallback, useMemo } from 'react';
import withCord from '../hoc/withCord.js';
import type { StyleProps } from '../../../experimental/types.js';
import type { MandatoryReplaceableProps } from '../replacements.js';
import { WithTooltip } from '../WithTooltip.js';
import { WithPopper } from '../helpers/WithPopper.js';
import { MenuButtonTooltip } from './MenuButtonTooltip.js';
import { Menu } from './Menu.js';
import type { MenuItemInfo } from './Menu.js';

export type MenuButtonProps = {
  button: JSX.Element;
  menuItems: MenuItemInfo[];
  menuVisible: boolean;
  setMenuVisible: (visible: boolean) => void;
  buttonTooltipLabel: string;
  disableButtonTooltip?: boolean;
} & StyleProps &
  MandatoryReplaceableProps;

export const MenuButton = withCord<React.PropsWithChildren<MenuButtonProps>>(
  forwardRef<HTMLElement, MenuButtonProps>(function MenuButton(
    {
      button,
      className,
      buttonTooltipLabel,
      menuItems,
      menuVisible,
      setMenuVisible,
      disableButtonTooltip,
      ...restProps
    },
    ref,
  ) {
    const showMenu = useCallback(() => {
      setMenuVisible(true);
    }, [setMenuVisible]);

    const hideMenu = useCallback(() => {
      setMenuVisible(false);
    }, [setMenuVisible]);

    const popperElement = useMemo(() => {
      return <Menu canBeReplaced items={menuItems} closeMenu={hideMenu} />;
    }, [hideMenu, menuItems]);

    if (menuItems.length === 0) {
      return null;
    }

    return (
      <WithTooltip
        tooltip={<MenuButtonTooltip label={buttonTooltipLabel} />}
        tooltipDisabled={menuVisible || disableButtonTooltip}
        ref={ref}
      >
        <WithPopper
          className={className}
          popperElement={popperElement}
          popperElementVisible={menuVisible}
          popperPosition="bottom-end"
          onShouldHide={hideMenu}
          onClick={showMenu}
          withBlockingOverlay={true}
          {...restProps}
        >
          {button}
        </WithPopper>
      </WithTooltip>
    );
  }),
  'MenuButton',
);
