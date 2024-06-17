import { createUseStyles } from 'react-jss';

import { useCordTranslation } from '@cord-sdk/react';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    alignItems: 'center',
    border: cssVar('composer-border'),
    borderRadius: cssVar('composer-border-radius'),
  },
  resolvedComposerText: {
    flexGrow: 1,
  },
});

type Props = {
  forwardRef?: React.MutableRefObject<HTMLDivElement | null>;
  reopenThread: () => void;
};

/**
 * @deprecated Please use ui3/ResolvedThreadComposer.tsx instead.
 **/
export function ResolvedThreadComposer({ forwardRef, reopenThread }: Props) {
  const { t } = useCordTranslation('composer');
  const classes = useStyles();

  return (
    <Box2
      forwardRef={forwardRef}
      className={classes.container}
      backgroundColor="base-strong"
      padding="2xs"
      margin="2xs"
    >
      <Text2 color="content-primary" className={classes.resolvedComposerText}>
        {t('resolved_status')}
      </Text2>
      <Button2 buttonType={'primary'} size={'medium'} onClick={reopenThread}>
        {t('unresolve_action')}
      </Button2>
    </Box2>
  );
}
