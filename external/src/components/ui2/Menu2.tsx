import { useCallback } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import type { MenuItem2 } from 'external/src/components/ui2/MenuItem2.tsx';
import type { MenuNavigationItem2 } from 'external/src/components/ui2/MenuNavigationItem2.tsx';
import type { Separator2 } from 'external/src/components/ui2/Separator2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { ContentBox2 } from 'external/src/components/ui2/ContentBox2.tsx';
import { ZINDEX } from 'common/ui/zIndex.ts';
import type { Button2 } from 'external/src/components/ui2/Button2.tsx';

type StyleProps = {
  maxHeight?: string;
};

const useStyles = createUseStyles({
  flexWrapper: {
    display: 'flex',
  },
  contentBoxContainer: {
    display: 'inline-flex',
    flexDirection: 'column',
    listStyle: 'none',
    minWidth: `calc(${cssVar('space-m')} * 10)`,
    zIndex: ZINDEX.popup,
  },
  scrollable: {
    overflowY: 'auto',
    overscrollBehavior: 'contain',
  },
  fullWidth: {
    width: '100%',
  },
  menuItemsContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    minHeight: 0,
  },
  maxHeight: ({ maxHeight }: StyleProps) => ({
    maxHeight: maxHeight,
  }),
});

type MenuItems =
  | typeof MenuItem2
  | typeof Separator2
  | typeof MenuNavigationItem2
  | typeof Button2;

type MenuProps = {
  fullWidth?: boolean;
  scrollable?: boolean;
  maxHeight?: string;
  children:
    | false
    | null
    | React.ReactElement<MenuItems | MenuItems[]>
    | Array<React.ReactElement<MenuItems> | false | null | JSX.Element[]>;
};

/**
 * @deprecated Use ui3/Menu instead
 */
export function Menu2({
  fullWidth = false,
  scrollable = true,
  maxHeight,
  children,
}: MenuProps) {
  const classes = useStyles({ maxHeight });

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => event.stopPropagation(),
    [],
  );

  return (
    <div className={classes.flexWrapper}>
      <ContentBox2
        className={cx(classes.contentBoxContainer, {
          [classes.fullWidth]: fullWidth,
          [classes.scrollable]: scrollable,
          [classes.maxHeight]: !!maxHeight,
        })}
        style={{
          margin: `0 ${cssVar('space-2xs')}`,
        }}
        type="raised"
        onClick={onClick}
      >
        <ol className={classes.menuItemsContainer}>{children}</ol>
      </ContentBox2>
    </div>
  );
}
