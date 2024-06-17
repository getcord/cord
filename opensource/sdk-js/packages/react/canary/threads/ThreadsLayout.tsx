import * as React from 'react';
import { forwardRef, useMemo } from 'react';

import type { ThreadsData } from '@cord-sdk/types';
import withCord from '../../experimental/components/hoc/withCord.js';
import type { NamedElements, StyleProps } from '../../betaV2.js';
import type { MandatoryReplaceableProps } from '../../experimental/components/replacements.js';
import { ThreadsScrollContainer } from './ThreadsScrollContainer.js';

export type ThreadsLayoutProps = {
  threadsData: ThreadsData;
  threads: JSX.Element[];
  /**
   * An array of named elements, added at the bottom of Threads, outside
   * the scroll container.
   */
  footerChildren?: NamedElements;
  /**
   * An array of named elements, added at the top of Threads, outside
   * the scroll container.
   */
  headerChildren?: NamedElements;
  /**
   * A placeholder element shown when there are no threads.
   */
  emptyThreadsPlaceholder: JSX.Element;
  /**
   * A simple loading spinner displayed during the loading of threads.
   */
  loadingIndicator: JSX.Element;
} & StyleProps &
  MandatoryReplaceableProps;

export const ThreadsLayout = withCord<
  React.PropsWithChildren<ThreadsLayoutProps>
>(
  forwardRef(function ThreadsLayout(
    props: ThreadsLayoutProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const {
      headerChildren,
      threads,
      threadsData,
      footerChildren,
      emptyThreadsPlaceholder,
      loadingIndicator,
      ...restProps
    } = props;
    const header = useMemo(
      () =>
        headerChildren?.map(
          ({ element, name }) => ({ ...element, key: name }) as JSX.Element,
        ),
      [headerChildren],
    );
    const footer = useMemo(
      () =>
        footerChildren?.map(
          ({ element, name }) => ({ ...element, key: name }) as JSX.Element,
        ),
      [footerChildren],
    );
    return (
      <div {...restProps} ref={ref}>
        {header}
        <ThreadsScrollContainer
          fetchMore={threadsData.fetchMore}
          hasMore={threadsData.hasMore}
          loading={threadsData.loading}
        >
          {emptyThreadsPlaceholder}
          {loadingIndicator}
          {threads}
        </ThreadsScrollContainer>
        {footer}
      </div>
    );
  }),
  'ThreadsLayout',
);
