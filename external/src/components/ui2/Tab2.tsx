import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { cssVar } from 'common/ui/cssVariables.ts';

import { Text2 } from 'external/src/components/ui2/Text2.tsx';

type Props = {
  tabIndex: number;
  title: string;
  activeTabIndex: number;
  onClick: (index: number) => void;
};

const useStyles = createUseStyles({
  main: {
    alignItems: 'center',
    backgroundColor: cssVar('color-base-strong'),
    borderRadius: cssVar('border-radius-medium'),
    color: cssVar('color-content-emphasis'),
    cursor: 'pointer',
    textAlign: 'center',
    padding: cssVar('space-3xs'),
    width: '100%',
    '&:hover': {
      backgroundColor: cssVar('color-base-x-strong'),
      color: cssVar('color-content-emphasis'),
    },
  },
  active: {
    backgroundColor: cssVar('color-base'),
    color: cssVar('color-content-emphasis'),
    pointerEvents: 'none',
  },
});

export function Tab2(props: Props) {
  const classes = useStyles();
  const { tabIndex, title, activeTabIndex, onClick } = props;

  return (
    <li
      className={cx(classes.main, {
        [classes.active]: activeTabIndex === tabIndex,
      })}
      onClick={() => onClick(tabIndex)}
    >
      <Text2 color="inherit" ellipsis font="small">
        {title}
      </Text2>
    </li>
  );
}
