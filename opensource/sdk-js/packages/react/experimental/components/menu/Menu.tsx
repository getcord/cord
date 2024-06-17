import * as React from 'react';
import { forwardRef, useCallback } from 'react';
import cx from 'classnames';
import withCord from '../hoc/withCord.js';
import * as classes from '../../../components/Menu.css.js';
import type { StyleProps } from '../../../betaV2.js';
import type { MandatoryReplaceableProps } from '../replacements.js';

// We need more than just the `element`, so we can manipulate items more easily
// including filtering out items or adding more items
export type MenuItemInfo = {
  name: string;
  element: JSX.Element;
};

export type MenuProps = {
  items: MenuItemInfo[];
  closeMenu: () => void;
} & StyleProps &
  MandatoryReplaceableProps &
  Pick<React.HTMLAttributes<HTMLOListElement>, 'onClick'>;

export const Menu = withCord<React.PropsWithChildren<MenuProps>>(
  forwardRef(function Menu(
    { className, items, onClick, closeMenu: _, ...restProps }: MenuProps,
    ref: React.ForwardedRef<HTMLOListElement>,
  ) {
    const onClickHandler = useCallback(
      (event: React.MouseEvent<HTMLOListElement>) => {
        event.stopPropagation();
        onClick?.(event);
      },
      [onClick],
    );

    return (
      <ol
        ref={ref}
        className={cx(classes.menu, className)}
        onClick={onClickHandler}
        {...restProps}
      >
        {items.map((item) => (
          <React.Fragment key={item.name}>{item.element}</React.Fragment>
        ))}
      </ol>
    );
  }),
  'Menu',
);
