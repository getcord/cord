import type { CSSProperties } from 'react';
import cx from 'classnames';
import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';
import type { IconType } from 'external/src/components/ui3/icons/Icon.tsx';
import type { ColorVar } from 'common/ui/cssVariables.ts';
import type { Avatar } from 'external/src/components/ui3/Avatar.tsx';
import type { Font } from 'common/ui/fonts.ts';
import { fontBody } from 'common/ui/atomicClasses/fonts.css.ts';

import * as classes from 'external/src/components/ui3/MenuItem.css.ts';
import { MODIFIERS } from 'common/ui/modifiers.ts';

type LeftItem = React.ReactElement<typeof Avatar | typeof Icon>;

type Label = {
  menuItemAction: string;
  label: string;
  iconAfterLabel?: IconType;
  labelFontStyle?: Font;
  labelColorOverride?: ColorVar;
};

type LeftItemLabelAndSubTitle = {
  leftItem: LeftItem;
  subtitle: string;
} & Label;

type LeftItemAndLabel = {
  leftItem: LeftItem;
} & Label;

type Props = {
  onClick?: JSX.IntrinsicElements['button']['onClick'];
  onMouseOver?: JSX.IntrinsicElements['button']['onMouseOver'];
  disabled?: boolean;
  selected?: boolean;
  style?: CSSProperties;
} & (LeftItemLabelAndSubTitle | LeftItemAndLabel | Label);

export function MenuItem(props: Props) {
  const {
    menuItemAction,
    label,
    onClick,
    onMouseOver,
    disabled,
    iconAfterLabel,
    selected,
    style,
  } = props;

  let leftItem: LeftItem | undefined;
  let subtitle: string | undefined;

  if ('leftItem' in props) {
    leftItem = props.leftItem;
  }

  if ('subtitle' in props) {
    subtitle = props.subtitle;
  }

  return (
    <li
      className={classes.listItemContainer}
      data-cord-menu-item={menuItemAction}
      style={style}
    >
      <button
        className={cx(classes.base, {
          [classes.textOnly]: !leftItem,
          [MODIFIERS.selected]: selected,
        })}
        onClick={onClick}
        onMouseOver={onMouseOver}
        disabled={disabled}
        type="button"
      >
        {leftItem ?? null}
        <p className={cx(classes.label, fontBody)}>{label}</p>
        {iconAfterLabel && (
          <Icon color="content-secondary" size="small" name={iconAfterLabel} />
        )}
        {subtitle && (
          <p className={cx(classes.subtitle, fontBody)}>{subtitle}</p>
        )}
      </button>
    </li>
  );
}
