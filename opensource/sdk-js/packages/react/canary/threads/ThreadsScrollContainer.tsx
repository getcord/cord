import React, { useCallback } from 'react';
import type { FetchMoreCallback } from '@cord-sdk/types';
import { ScrollContainer } from '../ScrollContainer.js';

const NUMBER_OF_THREADS_TO_FETCH = 10;

export type ThreadsScrollContainerProps = {
  fetchMore: FetchMoreCallback;
  loading: boolean;
  hasMore: boolean;
  children?: React.ReactNode;
};

export const ThreadsScrollContainer = (props: ThreadsScrollContainerProps) => {
  const { fetchMore, loading, hasMore, children } = props;

  // Fill up the available space with threads. We'll load more on scroll.
  const fetchUntilFilled = useCallback(
    (hasOverflow: boolean) => {
      if (!hasOverflow && !loading && hasMore) {
        void fetchMore?.(NUMBER_OF_THREADS_TO_FETCH);
      }
    },
    [fetchMore, hasMore, loading],
  );

  return (
    <ScrollContainer
      canBeReplaced
      onScrollToEdge={(edge) => {
        if (edge === 'bottom' && hasMore) {
          void fetchMore?.(NUMBER_OF_THREADS_TO_FETCH);
        }
      }}
      onContentSizeChange={fetchUntilFilled}
      autoScrollToNewest="never"
    >
      {children}
    </ScrollContainer>
  );
};
