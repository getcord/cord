import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import type { IconType } from 'external/src/components/ui2/icons/Icon2.tsx';
import type { ColorVar } from 'common/ui/cssVariables.ts';
import { addSpaceVars, cssVar } from 'common/ui/cssVariables.ts';
import type { Avatar2 } from 'external/src/components/ui2/Avatar2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import type { Font } from 'common/ui/fonts.ts';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';

type StyleProps = {
  labelColorOverride?: ColorVar;
};

const useStyles = createUseStyles({
  unsetDefaultStyle: {
    borderStyle: 'none',
  },
  base: ({ labelColorOverride }: StyleProps) => ({
    alignItems: 'center',
    borderRadius: cssVar('border-radius-medium'),
    display: 'flex',
    width: '100%',
    textAlign: 'center',
    // make sure that the icon does not change its size
    '& svg': {
      flexShrink: 0,
    },
    color: cssVar(`color-${labelColorOverride || 'content-emphasis'}`),
    cursor: 'pointer',
    '&:disabled': {
      cursor: 'unset',
      color: cssVar('color-content-secondary'),
    },
  }),
  activeAndHoverState: {
    '&:active': {
      backgroundColor: cssVar('color-base-x-strong'),
    },
    '&:not(:active):hover': {
      backgroundColor: cssVar('color-base-strong'),
    },
  },
  listItemContainer: {
    listStyle: 'none',
  },
  textOnly: {
    padding: `${addSpaceVars('4xs', '2xs')} ${cssVar('space-2xs')}`,
  },
  leftItemAndText: {
    gap: cssVar('space-2xs'),
    padding: `${addSpaceVars('4xs', '2xs')} ${cssVar('space-2xs')}`,
  },
  subtitle: {
    marginLeft: 'auto',
  },
  selected: {
    backgroundColor: cssVar('color-base-strong'),
  },
  notSelected: {
    backgroundColor: 'transparent',
  },
  labelAndIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: cssVar('space-3xs'),
    overflow: 'hidden',
  },
});

type LeftItem = React.ReactElement<typeof Avatar2 | typeof Icon2>;

type Label = {
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
  disableHoverStyles?: boolean;
  selected?: boolean;
  style?: CSSProperties;
} & (LeftItemLabelAndSubTitle | LeftItemAndLabel | Label);

/**
 * @deprecated Use ui3/MenuItem instead
 */
export function MenuItem2(props: Props) {
  const {
    label,
    onClick,
    onMouseOver,
    labelColorOverride,
    disabled,
    disableHoverStyles,
    iconAfterLabel,
    selected,
    style,
  } = props;

  const stylesProps = useMemo(
    () => ({ labelColorOverride }),
    [labelColorOverride],
  );
  const classes = useStyles(stylesProps);

  let leftItem: LeftItem | undefined;
  let subtitle: string | undefined;

  if ('leftItem' in props) {
    leftItem = props.leftItem;
  }

  if ('subtitle' in props) {
    subtitle = props.subtitle;
  }

  return (
    <li className={classes.listItemContainer} style={style}>
      <button
        className={cx(
          classes.unsetDefaultStyle,
          classes.base,
          leftItem ? classes.leftItemAndText : classes.textOnly,
          disabled || disableHoverStyles
            ? undefined
            : classes.activeAndHoverState,
          selected && !disabled ? classes.selected : classes.notSelected,
        )}
        onClick={onClick}
        onMouseOver={onMouseOver}
        disabled={disabled}
        type="button"
      >
        {leftItem ?? null}
        <Row2 className={classes.labelAndIcon}>
          <Text2
            color="content-emphasis"
            ellipsis={true}
            font={props.labelFontStyle}
          >
            {label}
          </Text2>
          {iconAfterLabel && (
            <Icon2
              color="content-secondary"
              size="small"
              name={iconAfterLabel}
            />
          )}
        </Row2>
        {subtitle && (
          <Text2
            ellipsis={true}
            className={classes.subtitle}
            color="content-secondary"
          >
            {subtitle}
          </Text2>
        )}
      </button>
    </li>
  );
}
