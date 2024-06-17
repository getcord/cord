import { useVirtualizer } from '@tanstack/react-virtual';

import * as React from 'react';
import { forwardRef, useCallback, useEffect, useRef } from 'react';
import cx from 'classnames';
import withCord from '../hoc/withCord.js';
import * as classes from '../../../components/Menu.css.js';
import type { MenuItemInfo, StyleProps } from '../../../betaV2.js';
import type { MandatoryReplaceableProps } from '../replacements.js';

const MAX_ROWS_TO_SHOW = 5;
const DEFAULT_ESTIMATED_ITEM_HEIGHT = 40;

export type VirtualizedMenuProps = {
  items: MenuItemInfo[];
  closeMenu: () => void;
  estimatedItemHeight?: number;
  selectedIndex?: number;
  maxRowsToShow?: number;
} & StyleProps &
  MandatoryReplaceableProps &
  Pick<React.HTMLAttributes<HTMLDivElement>, 'onClick'>;

export const VirtualizedMenu = withCord<
  React.PropsWithChildren<VirtualizedMenuProps>
>(
  forwardRef(function VirtualizedMenu(
    {
      className,
      items,
      onClick,
      closeMenu: _,
      selectedIndex,
      estimatedItemHeight = DEFAULT_ESTIMATED_ITEM_HEIGHT,
      maxRowsToShow = MAX_ROWS_TO_SHOW,
      ...restProps
    }: VirtualizedMenuProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const onClickHandler = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        onClick?.(event);
      },
      [onClick],
    );

    const parentRef = useRef<HTMLDivElement | null>(null);

    const rowVirtualizer = useVirtualizer({
      count: items.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => estimatedItemHeight,
    });

    useEffect(() => {
      selectedIndex && rowVirtualizer.scrollToIndex(selectedIndex);
    }, [rowVirtualizer, selectedIndex]);

    return (
      <div
        ref={ref}
        className={cx(classes.menu, className)}
        onClick={onClickHandler}
        {...restProps}
      >
        <div
          ref={parentRef}
          style={{
            height: `${
              Math.min(items.length, maxRowsToShow) * estimatedItemHeight
            }px`,
            width: '100%',
            overflow: 'auto',
          }}
        >
          <div
            style={{
              height: rowVirtualizer.getTotalSize(),
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <React.Fragment key={items[virtualRow.index].name}>
                  {items[virtualRow.index].element}
                </React.Fragment>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }),
  'VirtualizedMenu',
);
