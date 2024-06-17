import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import type { ColorVar } from 'common/ui/cssVariables.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { cordifyClassname } from 'common/ui/style.ts';

const useStyles = createUseStyles({
  deepLinked: {
    backgroundColor: cssVar('color-base-x-strong'),
  },
  rightElement: {
    marginLeft: 'auto',
  },
  pill: {
    paddingLeft: cssVar('space-2xs'),
    paddingRight: cssVar('space-2xs'),
    gap: cssVar('space-3xs'),
  },
  cursorPointer: {
    cursor: 'pointer',
  },
  cursorDefault: {
    cursor: 'default',
  },
});

type Row2Props = React.ComponentProps<typeof Row2>;

type Props = {
  backgroundColor: ColorVar;
  borderColor?: ColorVar;
  borderColorHover?: ColorVar;
  className?: string;
  leftElement: JSX.Element | null;
  middleElement: JSX.Element | null;
  rightElement: JSX.Element | null;
  onClick?: (event: React.MouseEvent) => void;
  forwardRef?: Row2Props['forwardRef'];
  onMouseOver?: Row2Props['onMouseOver'];
  onMouseLeave?: Row2Props['onMouseLeave'];
  marginTop?: Row2Props['marginTop'];
  marginLeft?: Row2Props['marginLeft'];
  marginRight?: Row2Props['marginRight'];
  contentEditable?: boolean;
};

export function Pill2({
  backgroundColor,
  borderColor,
  borderColorHover,
  className,
  leftElement,
  middleElement,
  rightElement,
  onClick,
  onMouseOver,
  onMouseLeave,
  marginTop,
  marginLeft,
  marginRight,
  contentEditable,
  forwardRef,
}: Props) {
  const classes = useStyles();
  return (
    <Row2
      // If no border provided, make it same as backgroundColor so it looks like
      // there's no border but the width/height is same as if there was a border
      borderColor={borderColor ?? backgroundColor}
      backgroundColor={backgroundColor}
      borderColorHover={borderColorHover}
      borderRadius="medium"
      onClick={onClick}
      className={cx(
        cordifyClassname('pill'),
        classes.pill,
        className,
        onClick ? classes.cursorPointer : classes.cursorDefault,
      )}
      height="3xl"
      forwardRef={forwardRef}
      onMouseOver={onMouseOver}
      onMouseLeave={onMouseLeave}
      marginTop={marginTop}
      marginLeft={marginLeft}
      marginRight={marginRight}
      contentEditable={contentEditable}
    >
      {leftElement}
      {middleElement}
      {rightElement && (
        <Row2 className={classes.rightElement}>{rightElement}</Row2>
      )}
    </Row2>
  );
}
