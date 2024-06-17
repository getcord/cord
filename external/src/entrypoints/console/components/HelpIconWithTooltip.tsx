import classnames from 'classnames';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import type { Placement } from 'react-bootstrap/esm/Overlay.js';
import { createUseStyles } from 'react-jss';

import { Sizes } from 'common/const/Sizes.ts';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';

const useStyles = createUseStyles({
  helpOutlineIcon: {
    cursor: 'help',
    marginLeft: Sizes.SMALL,
  },
});

type Props = {
  placement?: Placement;
  tooltipName: string;
  tooltipContent: string;
  className?: string;
};

export function HelpIconWithTooltip({
  placement = 'top',
  tooltipName,
  tooltipContent,
  className,
}: Props) {
  const classes = useStyles();
  return (
    <OverlayTrigger
      placement={placement}
      overlay={
        <Tooltip id={`${tooltipName}-tooltip`}>{tooltipContent}</Tooltip>
      }
    >
      <Icon2
        name="Question"
        color="inherit"
        className={classnames.default([classes.helpOutlineIcon, className])}
      />
    </OverlayTrigger>
  );
}
