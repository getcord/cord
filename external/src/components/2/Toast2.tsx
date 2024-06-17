import type { CSSProperties } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';

const useStyles = createUseStyles({
  toast: {
    borderRadius: cssVar('space-2xl'),
    cursor: 'default',
  },
  label: {
    flex: 1,
  },
});

type Props = {
  label: string | null;
  className?: string;
  onClose?: () => unknown;
  style?: CSSProperties;
};

/**
 * @deprecated Use ui3/Toast instead
 */
export function Toast2({ label, className, onClose, style }: Props) {
  const classes = useStyles();
  return (
    <Row2
      backgroundColor="content-emphasis"
      margin="2xs"
      paddingVertical="3xs"
      paddingLeft="m"
      paddingRight="xs"
      className={cx(className, classes.toast)}
      shadow="large"
      style={style}
    >
      <Text2
        center={true}
        color="base"
        font="small"
        ellipsis={true}
        className={classes.label}
      >
        {label}
      </Text2>
      <Button2 icon="X" buttonType="primary" size="small" onClick={onClose} />
    </Row2>
  );
}
