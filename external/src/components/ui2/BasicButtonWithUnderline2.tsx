import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import type { ColorVar } from 'common/ui/cssVariables.ts';
import type { Font } from 'common/ui/fonts.ts';
import type { IconType } from 'external/src/components/ui2/icons/Icon2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';

const useStyles = createUseStyles({
  basicButton: {
    alignItems: 'center',
    backgroundColor: 'unset',
    cursor: 'pointer',
    gap: cssVar('space-4xs'),
    display: 'inline-flex',
    textDecoration: 'none',
    width: 'fit-content',
    '&:hover $text, &:active $text': { textDecoration: 'underline' },
    '&:visited $text, &:disabled $text': {
      textDecoration: 'none',
    },
    '&:disabled': {
      cursor: 'unset',
    },
  },
  text: {},
  gapLarge: {
    gap: cssVar('space-2xs'),
  },
});

type BasicButtonProps = {
  label: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => unknown;
  labelColor?: ColorVar;
  labelFontStyle?: Font;
  className?: string;
  iconName?: IconType;
  iconPosition?: 'start' | 'end';
  disabled?: boolean;
};

/**
 * @deprecated Please use `ui3/ButtonWithUnderline` instead.
 */
export function BasicButtonWithUnderline2({
  label,
  onClick,
  labelColor,
  labelFontStyle = 'small',
  className,
  iconName,
  iconPosition = 'end',
  disabled,
}: BasicButtonProps) {
  const classes = useStyles();

  return (
    <button
      onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.stopPropagation();
        onClick?.(event);
      }}
      className={cx(className, classes.basicButton, {
        [classes.gapLarge]: !labelFontStyle.includes('small'),
      })}
      disabled={disabled}
      type="button"
    >
      {iconName && iconPosition === 'start' && (
        <Icon2
          name={iconName}
          color={labelColor}
          size={labelFontStyle.includes('small') ? 'small' : 'large'}
        />
      )}
      <Text2
        font={labelFontStyle}
        color={labelColor ?? 'content-emphasis'}
        className={classes.text}
        ellipsis={true}
      >
        {label}
      </Text2>
      {iconName && iconPosition === 'end' && (
        <Icon2
          name={iconName}
          color={labelColor}
          size={labelFontStyle.includes('small') ? 'small' : 'large'}
        />
      )}
    </button>
  );
}
