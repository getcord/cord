import { forwardRef, useCallback, useMemo } from 'react';
import cx from 'classnames';
import type { UIProps } from '@cord-sdk/react/common/ui/styleProps.ts';
import classes from 'external/src/components/ui3/Link.css.ts';
import {
  fontSmall,
  fontBody,
  fontSmallEmphasis,
  fontBodyEmphasis,
} from 'common/ui/atomicClasses/fonts.css.ts';

export type LinkStyle =
  | 'primary'
  | 'secondary'
  | 'primary-small'
  | 'secondary-small';

type LinkProps = UIProps<
  'a',
  'ellipsis',
  {
    linkStyle: LinkStyle;
    newTab?: boolean;
    underline?: boolean;
    preventDefault?: boolean;
  }
>;
type Props = React.PropsWithChildren<LinkProps>;

export const Link = forwardRef(function Link(
  props: Props,
  ref: React.Ref<HTMLAnchorElement>,
) {
  const propsWithDefaults = useMemo(() => ({ ...props }), [props]);
  const {
    linkStyle,
    children,
    className,
    newTab,
    underline = true,
    onClick: onClickProp,
    preventDefault,
    ellipsis,
    ...anchorElementProps
  } = propsWithDefaults;

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
    <a
      ref={ref}
      className={cx(className, classes.anchor, {
        [classes.noUnderline]: !underline,
        [classes.ellipsis]: ellipsis,
        [fontBodyEmphasis]: linkStyle === 'primary',
        [fontSmallEmphasis]: linkStyle === 'primary-small',
        [fontBody]: linkStyle === 'secondary',
        [fontSmall]: linkStyle === 'secondary-small',
      })}
      target={newTab ? '_blank' : '_top'}
      onClick={onClick}
      // eslint-disable-next-line i18next/no-literal-string
      {...(newTab && { rel: 'noReferrer ' })}
      {...anchorElementProps}
    >
      {children}
    </a>
  );
});
