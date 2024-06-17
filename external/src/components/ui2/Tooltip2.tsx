import { createUseStyles } from 'react-jss';

import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';

const useStyles = createUseStyles({
  tooltip: {
    backgroundColor: cssVar('tooltip-background-color'),
    color: cssVar('tooltip-content-color'),
    maxWidth: `calc(${cssVar('space-l')} * 10)`,
    overflowWrap: 'break-word',
    pointerEvents: 'none',
    width: 'fit-content',
  },
  subtitle: {
    color: cssVar('tooltip-content-color'),
    filter: 'opacity(65%)',
  },
});
export type TooltipProps = {
  label: string | null;
  subtitle?: string;
};

/**
 * @deprecated Use ui3/Tooltip2 instead
 */
export const Tooltip2 = ({ label, subtitle }: TooltipProps) => {
  const classes = useStyles();

  return (
    <Box2
      borderRadius="small"
      center={true}
      className={classes.tooltip}
      font="small-light"
      paddingHorizontal="2xs"
      paddingVertical="3xs"
      shadow="small"
    >
      <p>{label}</p>
      {subtitle && <p className={classes.subtitle}>{subtitle}</p>}
    </Box2>
  );
};
