import { forwardRef } from 'react';
import cx from 'classnames';
import { createUseStyles } from 'react-jss';

import type {
  CSSVariable,
  WithCSSVariableOverrides,
} from 'common/ui/cssVariables.ts';
import {
  cssValueWithOverride,
  cssVarWithOverride,
  cssVar,
  addSpaceVars,
  cssVarWithCustomFallback,
  cssVarIfExistsOtherwiseFallback,
} from 'common/ui/cssVariables.ts';
import type { StyleProps } from '@cord-sdk/react/common/ui/styleProps.ts';
import { useStyleProps } from 'external/src/components/ui2/useStyleProps.ts';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import type { IconType } from 'external/src/components/ui2/icons/Icon2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { SpinnerIcon2 } from 'external/src/components/ui2/icons/SpinnerIcon2.tsx';

type ButtonType = 'primary' | 'secondary' | 'tertiary';
type ButtonSize = 'small' | 'medium' | 'large';

type SizeStyle =
  | 'smallTextOnly'
  | 'smallIconOnly'
  | 'smallIconAndText'
  | 'mediumTextOnly'
  | 'mediumIconOnly'
  | 'mediumIconAndText'
  | 'largeTextOnly'
  | 'largeIconOnly'
  | 'largeIconAndText';

export type Button2CSSVariablesOverride = Partial<{
  fontSize: CSSVariable;
  lineHeight: CSSVariable;
  letterSpacing: CSSVariable;
  color: CSSVariable;
  backgroundColor: CSSVariable;
  colorHover: CSSVariable;
  backgroundColorHover: CSSVariable;
  colorActive: CSSVariable;
  backgroundColorActive: CSSVariable;
  colorDisabled: CSSVariable;
  backgroundColorDisabled: CSSVariable;
  padding: CSSVariable;
  gap: CSSVariable;
  iconSize: CSSVariable;
  height: CSSVariable;
  border: CSSVariable;
  borderRadius: CSSVariable;
}>;

type UseStyleProps = WithCSSVariableOverrides<
  { type: ButtonType },
  Button2CSSVariablesOverride
>;

const useStyles = createUseStyles({
  fullWidth: {
    width: '100%',
  },
  base: {
    cursor: 'pointer',
    maxWidth: '100%',
    textAlign: 'center',
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    position: 'relative',
    // make sure that the icon does not change it's size
    '& svg': {
      flex: 'none',
    },
  },
  // Need to set the `height` so that adding `border` to the button
  // doesn't move it around (by adding vertical space).
  height: ({ cssVariablesOverride }: UseStyleProps) => ({
    height: cssVarWithOverride(
      'button-height-auto',
      cssVariablesOverride?.height,
    ),
  }),
  borderRadius: ({ cssVariablesOverride }: UseStyleProps) => ({
    borderRadius: cssVarWithCustomFallback(
      'button-border-radius',
      cssVarWithOverride(
        'border-radius-medium',
        cssVariablesOverride?.borderRadius,
      ) ?? cssVar('border-radius-medium'),
    ),
  }),
  colors: ({ type, cssVariablesOverride }: UseStyleProps) => ({
    color: cssVarWithOverride(
      `${type}-button-content-color`,
      cssVariablesOverride?.color,
    ),
    backgroundColor: cssVarWithOverride(
      `${type}-button-background-color`,
      cssVariablesOverride?.backgroundColor,
    ),
    '& svg': {
      color: 'inherit',
    },
    '&:active': {
      color: cssVarWithOverride(
        `${type}-button-content-color--active`,
        cssVariablesOverride?.colorActive ?? cssVariablesOverride?.color,
      ),
      backgroundColor: cssVarWithOverride(
        `${type}-button-background-color--active`,
        cssVariablesOverride?.backgroundColorActive ??
          cssVariablesOverride?.backgroundColor,
      ),
    },
    '&:disabled': {
      color: cssVarWithOverride(
        `${type}-button-content-color--disabled`,
        cssVariablesOverride?.colorDisabled ?? cssVariablesOverride?.color,
      ),
      backgroundColor: cssVarWithOverride(
        `${type}-button-background-color--disabled`,
        cssVariablesOverride?.backgroundColorDisabled ??
          cssVariablesOverride?.backgroundColor,
      ),
      cursor: 'unset',
    },
    '&:not(:active):not(:disabled):hover': {
      color: cssVarWithOverride(
        `${type}-button-content-color--hover`,
        cssVariablesOverride?.colorHover ?? cssVariablesOverride?.color,
      ),
      backgroundColor: cssVarWithOverride(
        `${type}-button-background-color--hover`,
        cssVariablesOverride?.backgroundColorHover ??
          cssVariablesOverride?.backgroundColor,
      ),
    },
  }),
  border: ({ cssVariablesOverride }: UseStyleProps) => ({
    border: cssValueWithOverride(
      cssVar('button-border-none'),
      cssVariablesOverride?.border,
    ),
  }),
  smallTextOnly: ({ cssVariablesOverride }: UseStyleProps) => ({
    padding: cssVarWithCustomFallback(
      'button-small-text-only-padding',
      cssVarIfExistsOtherwiseFallback(
        cssVariablesOverride?.padding,
        `${cssVar('space-3xs')} ${cssVar('space-2xs')}`,
      ),
    ),
  }),
  smallIconOnly: ({ cssVariablesOverride }: UseStyleProps) => ({
    padding: cssVarWithCustomFallback(
      'button-small-icon-only-padding',
      cssVarIfExistsOtherwiseFallback(
        cssVariablesOverride?.padding,
        cssVar('space-3xs'),
      ),
    ),
  }),
  smallIconAndText: ({ cssVariablesOverride }: UseStyleProps) => ({
    gap: cssVarWithOverride('space-3xs', cssVariablesOverride?.gap),
    padding: cssVarWithCustomFallback(
      'button-small-icon-and-text-padding',
      cssVarIfExistsOtherwiseFallback(
        cssVariablesOverride?.padding,
        `${cssVar('space-3xs')} ${cssVar('space-2xs')}`,
      ),
    ),
  }),
  mediumTextOnly: ({ cssVariablesOverride }: UseStyleProps) => ({
    padding: cssVarWithCustomFallback(
      'button-medium-text-only-padding',
      cssVarIfExistsOtherwiseFallback(
        cssVariablesOverride?.padding,
        cssVar('space-2xs'),
      ),
    ),
  }),
  mediumIconOnly: ({ cssVariablesOverride }: UseStyleProps) => ({
    padding: cssVarWithCustomFallback(
      'button-medium-icon-only-padding',
      cssVarIfExistsOtherwiseFallback(
        cssVariablesOverride?.padding,
        addSpaceVars('4xs', '3xs'),
      ),
    ),
  }),
  mediumIconAndText: ({ cssVariablesOverride }: UseStyleProps) => ({
    gap: cssVarWithOverride('space-3xs', cssVariablesOverride?.gap),
    padding: cssVarWithCustomFallback(
      'button-medium-icon-and-text-padding',
      cssVarIfExistsOtherwiseFallback(
        cssVariablesOverride?.padding,
        `${addSpaceVars('4xs', '3xs')} ${cssVar('space-2xs')}`,
      ),
    ),
  }),
  largeTextOnly: ({ cssVariablesOverride }: UseStyleProps) => ({
    padding: cssVarWithCustomFallback(
      'button-large-text-only-padding',
      cssVarIfExistsOtherwiseFallback(
        cssVariablesOverride?.padding,
        `${addSpaceVars('4xs', '2xs')} ${cssVar('space-2xs')}`,
      ),
    ),
  }),
  largeIconOnly: ({ cssVariablesOverride }: UseStyleProps) => ({
    padding: cssVarWithCustomFallback(
      'button-large-icon-only-padding',
      cssVarIfExistsOtherwiseFallback(
        cssVariablesOverride?.padding,
        addSpaceVars('4xs', '2xs'),
      ),
    ),
  }),
  largeIconAndText: ({ cssVariablesOverride }: UseStyleProps) => ({
    gap: cssVarWithOverride('space-2xs', cssVariablesOverride?.gap),
    padding: cssVarWithCustomFallback(
      'button-large-icon-and-text-padding',
      cssVarIfExistsOtherwiseFallback(
        cssVariablesOverride?.padding,
        `${addSpaceVars('4xs', '2xs')} ${cssVar('space-2xs')}`,
      ),
    ),
  }),
  hide: {
    visibility: 'hidden',
  },
  translucent: {
    opacity: 0.5,
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    margin: 'auto',
  },
});

export type ButtonTypeProps = {
  icon?: IconType | URL;
  children?: string;
};

export type GeneralButtonProps = {
  buttonType: ButtonType;
  disabled?: boolean;
  isFullWidth?: boolean;
  isLoading?: boolean;
  isSubmit?: boolean;
  size: ButtonSize;
  cssVariablesOverride?: Button2CSSVariablesOverride;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => unknown;
  onMouseLeave?: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => unknown;
  onMouseDown?: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => unknown;
  additionalClassName?: string;
} & StyleProps<'marginPadding'>;

const emptyObj: Button2CSSVariablesOverride = {};

/**
 * @deprecated Use ui3/Button instead
 */
export const Button2 = forwardRef(function Button2(
  props: GeneralButtonProps & ButtonTypeProps,
  ref: React.Ref<HTMLButtonElement>,
) {
  const {
    icon,
    children,
    buttonType,
    disabled,
    isFullWidth = false,
    isLoading = false,
    isSubmit = false,
    size,
    cssVariablesOverride = emptyObj,
    additionalClassName,
    ...styleProps
  } = props;

  const classes = useStyles({
    type: buttonType,
    cssVariablesOverride,
  });

  const { className, onClick, onMouseLeave, onMouseDown, ...restProps } =
    useStyleProps(styleProps);

  const { className: sizeClassName } = useStyleProps({
    width: size === 'small' ? 'm' : 'l',
    height: size === 'small' ? 'm' : 'l',
    cssVariablesOverride: {
      width: cssVariablesOverride?.iconSize,
      height: cssVariablesOverride?.iconSize,
    },
  });

  if (!children && !icon) {
    return null;
  }

  const sizeStyle: SizeStyle =
    icon && children
      ? `${size}IconAndText`
      : !children
      ? `${size}IconOnly`
      : `${size}TextOnly`;

  return (
    <button
      {...restProps}
      className={cx(
        className,
        additionalClassName,
        classes.colors,
        classes.borderRadius,
        {
          [classes.fullWidth]: isFullWidth,
        },
        classes.base,
        classes.height,
        classes.border,
        classes[sizeStyle],
      )}
      disabled={disabled || isLoading}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      part="button"
      ref={ref}
      type={isSubmit ? 'submit' : 'button'}
    >
      {isLoading && (
        <SpinnerIcon2
          size={size === 'small' ? 'small' : 'large'}
          className={classes.loading}
        />
      )}
      {icon instanceof URL ? (
        <img
          className={cx(sizeClassName, {
            [classes.hide]: isLoading,
            [classes.translucent]: disabled,
          })}
          src={icon.toString()}
        />
      ) : (
        icon && (
          <Icon2
            className={cx({ [classes.hide]: isLoading })}
            name={icon}
            size={size === 'small' ? 'small' : 'large'}
            cssVariablesOverride={{
              width: props.cssVariablesOverride?.iconSize,
              height: props.cssVariablesOverride?.iconSize,
            }}
          />
        )
      )}
      {children && (
        <Text2
          className={cx({ [classes.hide]: isLoading })}
          ellipsis
          font={size === 'large' ? 'body' : 'small'}
          part="label"
          cssVariablesOverride={{
            fontSize: cssVariablesOverride?.fontSize,
            letterSpacing: cssVariablesOverride?.letterSpacing,
            lineHeight: cssVariablesOverride?.lineHeight,
          }}
          color="inherit"
        >
          {children}
        </Text2>
      )}
    </button>
  );
});
