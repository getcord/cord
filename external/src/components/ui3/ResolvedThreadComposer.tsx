import { useCordTranslation } from '@cord-sdk/react';
import { Button } from 'external/src/components/ui3/Button.tsx';

import * as classes from 'external/src/components/ui3/ResolvedThreadComposer.css.js';

type Props = {
  forwardRef?: React.MutableRefObject<HTMLDivElement | null>;
  reopenThread: () => void;
};

export function ResolvedThreadComposer({ forwardRef, reopenThread }: Props) {
  const { t } = useCordTranslation('composer');

  return (
    <div ref={forwardRef} className={classes.container}>
      <p className={classes.resolvedComposerText}>{t('resolved_status')}</p>
      <Button
        buttonAction="composer-reopen-thread"
        buttonType={'primary'}
        size={'medium'}
        onClick={reopenThread}
      >
        {t('unresolve_action')}
      </Button>
    </div>
  );
}
