import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { ZINDEX } from 'common/ui/zIndex.ts';
import { ACTION_BOX_ID } from 'common/const/ElementIDs.ts';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';

const useStyles = createUseStyles({
  container: {
    position: 'fixed',
    bottom: cssVar('space-m'),
    pointerEvents: 'auto',
    zIndex: ZINDEX.popup,
    backgroundColor: cssVar('tooltip-background-color'),
  },
  text: {
    cursor: 'default',
    color: cssVar('tooltip-content-color'),
    fontSize: cssVar('font-size-small'),
    fontFamily: cssVar('font-family'),
  },
  actionLink: {
    flexGrow: 0,
    textDecoration: 'underline',
    cursor: 'pointer',
    color: cssVar('tooltip-content-color'),
    fontSize: cssVar('font-size-small'),
    fontFamily: cssVar('font-family'),
    marginLeft: cssVar('space-s'),
  },
  center: {
    right: '50%',
    tranform: 'translateX(-50%)',
  },
});

type Props = {
  actionCallback: () => void;
  text: string;
  actionText: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  forwardRef?: React.RefObject<HTMLDivElement>;
  center?: boolean;
};

export function ActionBox({
  actionCallback,
  text,
  actionText,
  onMouseEnter,
  onMouseLeave,
  forwardRef,
  center,
}: Props) {
  const classes = useStyles();

  return (
    <Box2
      row
      data-cord-hide-element
      id={ACTION_BOX_ID}
      className={cx(classes.container, { [classes.center]: center })}
      borderRadius="medium"
      paddingVertical="2xs"
      paddingHorizontal="xs"
      forwardRef={forwardRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      // Stop click propagating - e.g. we don't to add an annotation on click
      onClick={(e) => e.stopPropagation()}
    >
      <div className={classes.text}>{text}</div>
      <div onClick={actionCallback} className={classes.actionLink}>
        {actionText}
      </div>
    </Box2>
  );
}
