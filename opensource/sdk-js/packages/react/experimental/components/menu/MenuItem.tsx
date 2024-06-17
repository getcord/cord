import * as React from 'react';

import { forwardRef } from 'react';
import cx from 'classnames';
import type { Avatar } from '../avatar/Avatar.js';
import * as classes from '../../../components/MenuItem.css.js';
import withCord from '../hoc/withCord.js';
import { Icon } from '../../../components/helpers/Icon.js';
import type { IconType } from '../../../components/helpers/Icon.js';
import { fontBody } from '../../../common/ui/atomicClasses/fonts.css.js';

import { MODIFIERS } from '../../../common/ui/modifiers.js';
import type { StyleProps } from '../../../betaV2.js';
import type { MandatoryReplaceableProps } from '../replacements.js';

type LeftItem = React.ReactElement<typeof Avatar | typeof Icon>;

export type MenuItemProps = {
  disabled?: boolean;
  selected?: boolean;
  menuItemAction: string;
  label: string;
  iconAfterLabel?: IconType;
  leftItem?: LeftItem;
  subtitle?: string;
  onClick: (e: React.MouseEvent<HTMLLIElement>) => void;
} & StyleProps &
  MandatoryReplaceableProps &
  Pick<React.HTMLAttributes<HTMLLIElement>, 'onMouseOver'>;

export const MenuItem = withCord<React.PropsWithChildren<MenuItemProps>>(
  forwardRef(function MenuItem(
    props: MenuItemProps,
    ref: React.Ref<HTMLLIElement>,
  ) {
    const {
      className,
      menuItemAction,
      label,
      disabled,
      iconAfterLabel,
      selected,
      leftItem,
      subtitle,
      ...restProps
    } = props;

    return (
      <li
        {...restProps}
        data-cord-menu-item={menuItemAction}
        className={cx(classes.listItemContainer, className)}
        ref={ref}
      >
        <button
          className={cx(classes.base, {
            [classes.textOnly]: !leftItem,
            [MODIFIERS.selected]: selected,
          })}
          disabled={disabled}
          type="button"
        >
          {leftItem ?? null}
          <p className={cx(classes.label, fontBody)}>{label}</p>
          {iconAfterLabel && (
            <Icon
              color="content-secondary"
              size="small"
              name={iconAfterLabel}
            />
          )}
          {subtitle && (
            <p className={cx(classes.subtitle, fontBody)}>{subtitle}</p>
          )}
        </button>
      </li>
    );
  }),
  'MenuItem',
);
