import type { CSSProperties } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { Styles } from 'common/const/Styles.ts';

const useStyles = createUseStyles({
  menu: {
    background: Colors.WHITE,
    border: '1px ' + Colors.GREY_LIGHT + ' solid',
    borderRadius: Sizes.SMALL + 'px',
    boxShadow: Styles.DEFAULT_SHADOW,
    padding: Sizes.MEDIUM + 'px',
  },
  item: {
    alignItems: 'center',
    borderRadius: Sizes.SMALL + 'px',
    cursor: 'pointer',
    display: 'flex',
    fontSize: Sizes.DEFAULT_TEXT_SIZE_PX + 'px',
    justifyContent: 'space-between',
    lineHeight: Sizes.DEFAULT_LINE_HEIGHT_PX + 'px',
    padding: Sizes.MEDIUM + 'px',
  },
  itemSelected: {
    backgroundColor: Colors.GREY_X_LIGHT,
  },
  promptContainer: {
    cursor: 'pointer',
    paddingLeft: Sizes.MEDIUM,
    paddingRight: Sizes.MEDIUM,
    paddingTop: Sizes.MEDIUM,
  },
  separator: {
    borderTop: '1px ' + Colors.GREY_LIGHT + ' solid',
    marginLeft: -Sizes.MEDIUM,
    marginRight: -Sizes.MEDIUM,
    marginTop: Sizes.MEDIUM,
  },
});

type MenuItem<I extends object> = { id: string } & I;

type Props<I extends object> = {
  items: MenuItem<I>[];
  onItemClick: (item: I, index: number) => void;
  renderItem: (item: I) => any;
  selectedIndex: number | null;
  setSelectedIndex: (index: number) => void;
  itemStyle?: CSSProperties | ((item: I) => CSSProperties);
  connectToSlackPrompt?: JSX.Element | null;
  unshownUserCountLine?: JSX.Element | null;
};

/**
 * @deprecated Use ui3/InlineMenu instead
 */
export const InlineMenu = <I extends object>({
  items,
  onItemClick,
  renderItem,
  selectedIndex,
  setSelectedIndex,
  itemStyle,
  connectToSlackPrompt,
  unshownUserCountLine,
}: Props<I>) => {
  const classes = useStyles();

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
            style={
              !itemStyle
                ? {}
                : typeof itemStyle === 'function'
                ? itemStyle(item)
                : itemStyle
            }
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
