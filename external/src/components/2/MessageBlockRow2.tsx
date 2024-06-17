import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { MESSAGE_BLOCK_AVATAR_SIZE } from 'common/const/Sizes.ts';
import type { UIProps } from '@cord-sdk/react/common/ui/styleProps.ts';

const useStyles = createUseStyles({
  messageBlockRow: {
    gap: cssVar('space-2xs'),
  },
  leftBox: {
    alignItems: 'center',
    display: 'flex',
    flex: 'none',
  },
  minWidth: {
    minWidth: cssVar(`space-${MESSAGE_BLOCK_AVATAR_SIZE}`),
  },
  rightRow: {
    alignItems: 'inherit',
    flex: 1,
    gap: 'inherit',
    minWidth: 0,
  },
  leftElementCenterAlignment: {
    justifyContent: 'center',
  },
  leftElementEndAlignment: {
    justifyContent: 'flex-end',
  },
});

type MessageBlockRow2Props = UIProps<
  'div',
  'marginPadding',
  {
    highlighted?: boolean;
    forwardRef?: React.RefObject<HTMLDivElement>;
    leftElement: JSX.Element | null;
    leftElementAlignment?: 'center' | 'flex-end';
    useMinWidthForLeft?: boolean;
    className?: string;
  }
>;

export function MessageBlockRow2({
  highlighted,
  forwardRef,
  leftElement,
  useMinWidthForLeft,
  leftElementAlignment = 'center',
  className,
  children,
  ...otherProps
}: React.PropsWithChildren<MessageBlockRow2Props>) {
  const classes = useStyles();

  return (
    <Row2
      forwardRef={forwardRef}
      className={cx(classes.messageBlockRow, className)}
      backgroundColor={highlighted ? 'base-strong' : undefined}
      {...otherProps}
    >
      <Box2
        width={useMinWidthForLeft ? undefined : MESSAGE_BLOCK_AVATAR_SIZE}
        className={cx(
          classes.leftBox,
          useMinWidthForLeft && classes.minWidth,
          leftElementAlignment === 'center'
            ? classes.leftElementCenterAlignment
            : classes.leftElementEndAlignment,
        )}
      >
        {leftElement}
      </Box2>
      <Row2 className={classes.rightRow}>{children}</Row2>
    </Row2>
  );
}
