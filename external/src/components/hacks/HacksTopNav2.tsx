import { createUseStyles } from 'react-jss';

import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';

const useStyles = createUseStyles({
  hacksTopNavContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
});

export function HacksTopNav2({ closeHacks }: { closeHacks: () => void }) {
  const classes = useStyles();

  return (
    <Row2
      className={classes.hacksTopNavContainer}
      backgroundColor="base"
      padding="2xs"
    >
      <WithTooltip2 label="Close" popperPosition="bottom">
        <Button2
          buttonType="secondary"
          icon="X"
          size="medium"
          onClick={() => closeHacks()}
        />
      </WithTooltip2>
    </Row2>
  );
}
