import { createUseStyles } from 'react-jss';

import { BasicButtonWithUnderline2 } from 'external/src/components/ui2/BasicButtonWithUnderline2.tsx';
import type { ColorVar } from 'common/ui/cssVariables.ts';

const useStyles = createUseStyles({
  toggleButtonWrapper: {
    display: 'flex',
    justifyContent: 'center',
  },
});

export function Toggle2({
  expanded,
  onClick,
  expandedLabel,
  collapsedLabel,
  color,
}: {
  expanded: boolean;
  onClick: () => void;
  expandedLabel: string;
  collapsedLabel: string;
  color?: ColorVar;
}) {
  const classes = useStyles();
  return (
    <div className={classes.toggleButtonWrapper}>
      <BasicButtonWithUnderline2
        label={expanded ? expandedLabel : collapsedLabel}
        onClick={onClick}
        labelColor={color}
        iconName={expanded ? 'UpSolid' : 'DownSolid'}
      />
    </div>
  );
}
