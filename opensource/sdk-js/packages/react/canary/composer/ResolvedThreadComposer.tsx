import * as React from 'react';
import cx from 'classnames';
import { forwardRef, useCallback } from 'react';
import type { ClientThreadData } from '@cord-sdk/types';
import withCord from '../../experimental/components/hoc/withCord.js';
import { useCordTranslation } from '../../index.js';
import type { StyleProps } from '../../betaV2.js';
import { setResolved } from '../../common/lib/thread.js';
import type { MandatoryReplaceableProps } from '../../experimental/components/replacements.js';
import * as classes from './ResolvedThreadComposer.css.js';
import { ReopenThreadButton } from './ReopenThreadButton.js';

export type ResolvedThreadComposerProps = {
  thread: ClientThreadData;
  onReopenThread?: () => void;
} & StyleProps &
  MandatoryReplaceableProps;

export const ResolvedThreadComposer = withCord<
  React.PropsWithChildren<ResolvedThreadComposerProps>
>(
  forwardRef(function ResolvedThreadComposer(
    {
      onReopenThread,
      thread,
      className,
      ...restProps
    }: ResolvedThreadComposerProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { t } = useCordTranslation('composer');
    const threadID = thread.thread?.id;

    const handleReopenThread = useCallback(() => {
      if (threadID) {
        onReopenThread?.();
        void setResolved(threadID, false);
      }
    }, [onReopenThread, threadID]);

    return (
      <div
        ref={ref}
        className={cx(className, classes.container)}
        {...restProps}
      >
        <p className={classes.resolvedComposerText}>{t('resolved_status')}</p>
        <ReopenThreadButton canBeReplaced onClick={handleReopenThread} />
      </div>
    );
  }),
  'ResolvedThreadComposer',
);
