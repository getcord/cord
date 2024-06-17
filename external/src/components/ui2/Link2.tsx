import { useCallback, useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { useStyleProps } from 'external/src/components/ui2/useStyleProps.ts';
import type { Font } from 'common/ui/fonts.ts';
import type { UIProps } from '@cord-sdk/react/common/ui/styleProps.ts';

const useStyles = createUseStyles({
  anchor: {
    textDecoration: 'none',
    '&:hover, &:active': { textDecoration: 'underline' },
    '&:visited': {
      textDecoration: 'none',
    },
  },
  pointer: {
    cursor: 'pointer',
  },
  noUnderline: {
    '&:hover, &:active': {
      textDecoration: 'none',
    },
  },
});

export type LinkStyle =
  | 'primary'
  | 'secondary'
  | 'primary-small'
  | 'secondary-small';

type LinkProps = UIProps<
  'a',
  'color' | 'ellipsis',
  {
    linkStyle: LinkStyle;
    newTab?: boolean;
    underline?: boolean;
    preventDefault?: boolean;
  }
>;

type Props = React.PropsWithChildren<LinkProps>;

export function Link2(props: Props) {
  const classes = useStyles();

  const propsWithDefaults = useMemo(
    () => ({
      ...props,
      color: props.color ?? 'content-emphasis',
    }),
    [props],
  );

  const {
    linkStyle,
    children,
    className,
    newTab,
    underline = true,
    onClick: onClickProp,
    preventDefault,
    ...anchorElementProps
  } = useStyleProps(propsWithDefaults, 'forwardRef');

  const font: Font = useMemo(() => {
    switch (linkStyle) {
      case 'primary':
        return 'body-emphasis';
      case 'primary-small':
        return 'small-emphasis';
      case 'secondary':
        return 'body';
      case 'secondary-small':
        return 'small';
    }
  }, [linkStyle]);

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (preventDefault) {
        event.preventDefault();
      }
      onClickProp?.(event);
    },
    [preventDefault, onClickProp],
  );

  return (
    <Text2
      as="a"
      font={font}
      className={cx(className, classes.anchor, classes.pointer, {
        [classes.noUnderline]: !underline,
      })}
      target={newTab ? '_blank' : '_top'}
      onClick={onClick}
      // eslint-disable-next-line i18next/no-literal-string
      {...(newTab && { rel: 'noReferrer ' })}
      {...anchorElementProps}
    >
      {children}
    </Text2>
  );
}
