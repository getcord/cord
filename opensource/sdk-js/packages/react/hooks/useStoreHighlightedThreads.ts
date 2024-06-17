import type { SortBy, ThreadSummary } from '@cord-sdk/types';
import { useEffect, useState } from 'react';
import { sortThreads } from '../common/lib/sortThreads.js';

export function useStoreHighlightedThreads({
  currentHighlightedThread,
  sortBy,
}: {
  currentHighlightedThread?: ThreadSummary;
  sortBy: SortBy;
}) {
  const [highlightedThreads, setHighlightedThreads] = useState<ThreadSummary[]>(
    [],
  );

  useEffect(() => {
    if (!currentHighlightedThread) {
      return;
    }
    setHighlightedThreads((oldThreads) => {
      const ids = new Set(oldThreads.map((t) => t.id));
      if (ids.has(currentHighlightedThread.id)) {
        return sortThreads(oldThreads, sortBy);
      }
      const newThreads = [...oldThreads, currentHighlightedThread];

      return sortThreads(newThreads, sortBy);
    });
  }, [currentHighlightedThread, setHighlightedThreads, sortBy]);

  return highlightedThreads;
}
