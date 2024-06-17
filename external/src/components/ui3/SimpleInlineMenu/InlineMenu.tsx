import cx from 'classnames';

import * as classes from 'external/src/components/ui3/SimpleInlineMenu/SimpleInlineMenu.css.ts';

type MenuItem<I extends object> = { id: string } & I;

type Props<I extends object> = {
  items: MenuItem<I>[];
  onItemClick: (item: I, index: number) => void;
  renderItem: (item: I) => any;
  selectedIndex: number | null;
  setSelectedIndex: (index: number) => void;
  connectToSlackPrompt?: JSX.Element | null;
  unshownUserCountLine?: JSX.Element | null;
};

export const InlineMenu = <I extends object>({
  items,
  onItemClick,
  renderItem,
  selectedIndex,
  setSelectedIndex,
  connectToSlackPrompt,
  unshownUserCountLine,
}: Props<I>) => {
  return (
    <div className={classes.menu}>
      <ul>
        {items.map((item, index) => (
          <li
            key={item.id}
            onClick={(event) => {
              onItemClick(item, index);
              event.stopPropagation();
            }}
            onMouseOver={() => setSelectedIndex(index)}
            className={cx(classes.item, {
              [classes.itemSelected]: selectedIndex === index,
            })}
          >
            {renderItem(item)}
          </li>
        ))}
        {unshownUserCountLine && (
          <li key="unshownUserCount">{unshownUserCountLine}</li>
        )}
        {connectToSlackPrompt}
      </ul>
    </div>
  );
};
