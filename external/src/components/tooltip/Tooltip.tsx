import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { Sizes } from 'common/const/Sizes.ts';
import { cssVar } from 'common/ui/cssVariables.ts';

const useStyles = createUseStyles({
  tooltip: {
    backgroundColor: cssVar('tooltip-background-color'),
    borderRadius: Sizes.SMALL + 'px',
    color: cssVar('tooltip-content-color'),
    fontSize: cssVar('font-size-small'),
    lineHeight: Sizes.TOOLTIP_LINE_HEIGHT_PX + 'px',
    margin: Sizes.SMALL,
    maxWidth: Sizes.TOOLTIP_MAX_WIDTH_PX + 'px',
    overflowWrap: 'break-word',
    padding: `${Sizes.TOOLTIP_VERTICAL_PADDING_PX}px ${Sizes.TOOLTIP_HORIZONTAL_PADDING_PX}px`,
    textAlign: 'center',
    pointerEvents: 'none',
  },
  subtitle: {
    filter: 'opacity(65%)',
  },
});

type TooltipProps = {
  label: string;
  subtitle?: string;
  className?: string;
};

export const Tooltip = ({ label, subtitle, className }: TooltipProps) => {
  const classes = useStyles();

  return (
    <div className={cx(classes.tooltip, className)}>
      <p>{label}</p>
      {subtitle && <p className={classes.subtitle}>{subtitle}</p>}
    </div>
  );
};
