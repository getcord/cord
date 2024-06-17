import React, { useCallback } from 'react';
import type { FetchMoreCallback } from '@cord-sdk/types';
import { ScrollContainer } from '../ScrollContainer.js';

const NUMBER_OF_MESSAGES_TO_FETCH = 10;

export type ThreadScrollContainerProps = React.PropsWithChildren<{
  fetchMore: FetchMoreCallback;
  threadLoading: boolean;
  hasMore: boolean;
}>;

export const ThreadScrollContainer = (props: ThreadScrollContainerProps) => {
  const { fetchMore, threadLoading, hasMore, children } = props;

  // Fill up the available space with threads. We'll load more on scroll.
  const fetchUntilFilled = useCallback(
    (hasOverflow: boolean) => {
      if (!hasOverflow && !threadLoading && hasMore) {
        void fetchMore?.(NUMBER_OF_MESSAGES_TO_FETCH);
      }
    },
    [fetchMore, hasMore, threadLoading],
  );

  return (
    <ScrollContainer
      canBeReplaced
      onScrollToEdge={(edge) => {
        if (edge === 'top' && hasMore) {
          void fetchMore?.(NUMBER_OF_MESSAGES_TO_FETCH);
        }
      }}
      onContentSizeChange={fetchUntilFilled}
    >
      {children}
    </ScrollContainer>
  );
};
