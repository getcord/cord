import { useCallback } from 'react';
import cx from 'classnames';

import * as classes from 'external/src/components/ui3/Menu.css.ts';
import type { MenuItem } from 'external/src/components/ui3/MenuItem.tsx';
import type { MenuNavigationItem } from 'external/src/components/ui3/MenuNavigationItem.tsx';
import type { Separator } from 'external/src/components/ui3/Separator.tsx';
import type { Button } from 'external/src/components/ui3/Button.tsx';

type MenuItems =
  | typeof MenuItem
  | typeof Separator
  | typeof MenuNavigationItem
  | typeof Button;

type MenuProps = {
  className?: string;
  children:
    | false
    | null
    | React.ReactElement<MenuItems | MenuItems[]>
    | Array<React.ReactElement<MenuItems> | false | null | JSX.Element[]>;
  /** @deprecated **/
  fullWidth?: boolean;
  /** @deprecated **/
  scrollable?: boolean;
  /** @deprecated **/
  maxHeight?: string;
};

export function Menu({ className, children }: MenuProps) {
  const onClick = useCallback(
    (event: React.MouseEvent<HTMLOListElement>) => event.stopPropagation(),
    [],
  );

  return (
    <ol className={cx(classes.menu, className)} onClick={onClick}>
      {children}
    </ol>
  );
}
export const newSimpleInlineMenuConfig = {
  NewComp: Menu,
  configKey: 'menu',
} as const;
