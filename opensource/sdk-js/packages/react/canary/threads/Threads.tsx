import * as React from 'react';
import { forwardRef, useMemo } from 'react';

import cx from 'classnames';
import withCord from '../../experimental/components/hoc/withCord.js';
import { LoadingIndicator, SendComposer } from '../../betaV2.js';
import type {
  ByOptions,
  WithByOptionsComponent,
  ThreadsByOptionsProps,
  ThreadsProps,
} from '../../betaV2.js';
import { SpinnerIcon } from '../../common/icons/customIcons/SpinnerIcon.js';

import { useThreads } from '../../hooks/thread.js';
import classes from './Threads.css.js';
import { ThreadsLayout } from './ThreadsLayout.js';
import type { ThreadsLayoutProps } from './ThreadsLayout.js';
import { InlineThreadWrapper } from './InlineThread.js';
import { EmptyThreadsPlaceholderWrapper } from './EmptyThreadsPlaceholder.js';

export const Threads: WithByOptionsComponent<
  ThreadsProps,
  ThreadsByOptionsProps
> = Object.assign(
  withCord<React.PropsWithChildren<ThreadsProps>>(
    forwardRef(function Threads(
      {
        threadsData,
        className,
        composerOptions,
        showThreadsHeader = false,
        ...restProps
      }: ThreadsProps,
      ref: React.ForwardedRef<HTMLDivElement>,
    ) {
      const threadsToRender = useMemo(
        () =>
          threadsData.threads
            .filter((t) => !!t.firstMessage)
            .map((t) => (
              <InlineThreadWrapper
                showThreadHeader={showThreadsHeader}
                key={t.id}
                thread={t}
              />
            )),
        [showThreadsHeader, threadsData.threads],
      );

      const sendComposer: Partial<
        | Pick<ThreadsLayoutProps, 'footerChildren' | 'headerChildren'>
        | undefined
      > = useMemo(() => {
        if (!composerOptions) {
          return;
        }

        const { position, ...restComposerProps } = composerOptions;

        const composer = [
          {
            name: 'composer',
            element: (
              <SendComposer canBeReplaced createThread={restComposerProps} />
            ),
          },
        ];

        if (position === 'top') {
          return { headerChildren: composer };
        } else {
          return { footerChildren: composer };
        }
      }, [composerOptions]);

      return (
        <ThreadsLayout
          ref={ref}
          canBeReplaced
          threadsData={threadsData}
          threads={threadsToRender}
          emptyThreadsPlaceholder={
            <EmptyThreadsPlaceholderWrapper
              groupID={composerOptions?.groupID}
              threadsData={threadsData}
            />
          }
          loadingIndicator={
            <LoadingIndicator
              id="threads-loading"
              hidden={!threadsData.loading}
              icon={<SpinnerIcon />}
              canBeReplaced
            />
          }
          className={cx(classes.threads, className)}
          {...sendComposer}
          {...restProps}
        />
      );
    }),
    'Threads',
  ),
  { ByOptions: ThreadsByOptions },
);

function ThreadsByOptions(props: ByOptions<ThreadsByOptionsProps>) {
  const { options, ...restProps } = props;
  const threadsData = useThreads(options);

  return <Threads threadsData={threadsData} {...restProps} canBeReplaced />;
}
