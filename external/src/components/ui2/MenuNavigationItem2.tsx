import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { addSpaceVars, cssVar } from 'common/ui/cssVariables.ts';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';

const useStyles = createUseStyles({
  unsetDefaultStyle: {
    borderStyle: 'none',
    lineHeight: 0,
  },
  iconContainer: {
    backgroundColor: cssVar('color-base-strong'),
    borderRadius: cssVar('border-radius-medium'),
    cursor: 'pointer',
    flexShrink: 0,
    padding: cssVar('space-4xs'),
    '&:not(:active):hover': {
      backgroundColor: cssVar('color-base-x-strong'),
    },
  },
  listItemContainer: {
    alignItems: 'center',
    borderRadius: cssVar('border-radius-medium'),
    color: cssVar('color-content-emphasis'),
    display: 'flex',
    gap: cssVar('space-2xs'),
    listStyle: 'none',
    padding: `${addSpaceVars('4xs', '2xs')} ${cssVar('space-2xs')}`,
    textAlign: 'center',
    width: '100%',
  },
});

type Props = {
  label: string;
  onClick?: JSX.IntrinsicElements['button']['onClick'];
};

export function MenuNavigationItem2({ label, onClick }: Props) {
  const classes = useStyles();

  return (
    <li className={classes.listItemContainer}>
      <button
        className={cx(classes.unsetDefaultStyle, classes.iconContainer)}
        onClick={onClick}
        type="button"
      >
        <Icon2 name="CaretLeft" size="small" />
      </button>
      <Text2 font="body-emphasis" color="content-emphasis">
        {label}
      </Text2>
    </li>
  );
}
