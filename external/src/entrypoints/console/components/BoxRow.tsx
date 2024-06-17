import { createUseStyles } from 'react-jss';
import { HelpIconWithTooltip } from 'external/src/entrypoints/console/components/HelpIconWithTooltip.tsx';
import { Sizes } from 'common/const/Sizes.ts';

const useStyles = createUseStyles({
  label: {
    fontWeight: 500,
    margin: 0,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelGroup: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBlockStart: Sizes.MEDIUM,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '25% 75%',
    width: '100%',
  },
});

type BoxRowProps = React.PropsWithChildren<{
  label?: string;
  tooltip?: string;
}>;

export function BoxRow({ label = '', tooltip, children }: BoxRowProps) {
  const classes = useStyles();

  return (
    <div className={classes.row}>
      <div className={classes.labelGroup}>
        <label className={classes.label}>
          {label}
          {tooltip && (
            <HelpIconWithTooltip
              placement="right"
              tooltipName={label}
              tooltipContent={tooltip}
            />
          )}
        </label>
      </div>
      <div>{children}</div>
    </div>
  );
}
