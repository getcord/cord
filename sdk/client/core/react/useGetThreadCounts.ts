import { useState, useEffect } from 'react';
import {
  getLocationFilter,
  getResolvedFromStatus,
  getViewerThreadFilter,
} from 'common/types/index.ts';
import {
  useThreadActivityQuery,
  useThreadActivitySummarySubscription,
} from 'external/src/graphql/operations.ts';
import type {
  ClientThreadFilter,
  ThreadActivitySummary,
} from '@cord-sdk/types';
import type {
  ThreadActivitySummaryFragment,
  PageContextInput,
} from 'external/src/graphql/operations.ts';

export function useGetThreadCounts({
  filter,
}: {
  filter?: ClientThreadFilter;
}) {
  const { metadata, location, resolvedStatus, groupID, viewer, ...rest } =
    filter ?? {};
  const _: Record<string, never> = rest;

  const [counts, setCounts] = useState<ThreadActivitySummary>();
  const locationFilter = getLocationFilter(location);
  const viewerFilter = getViewerThreadFilter(viewer);
  const resolved = getResolvedFromStatus(resolvedStatus ?? 'any');
  let pageContext: PageContextInput | undefined;
  if (locationFilter) {
    pageContext = {
      providerID: undefined,
      data: locationFilter.value,
    };
  }

  const getCounts = (threadSummary: ThreadActivitySummaryFragment) => {
    return {
      total: threadSummary.totalThreadCount,
      unread: threadSummary.unreadThreadCount,
      new: threadSummary.newThreadCount,
      unreadSubscribed: threadSummary.unreadSubscribedThreadCount,
      resolved: threadSummary.resolvedThreadCount,
      empty: threadSummary.emptyThreadCount,
    };
  };

  const { error: threadSummaryError, loading: threadSummaryLoading } =
    useThreadActivityQuery({
      variables: {
        pageContext,
        partialMatch: !!locationFilter?.partialMatch,
        metadata,
        viewer: viewerFilter,
        resolved,
        _externalOrgID: groupID,
      },
      onCompleted: (threadSummaryData) => {
        if (!threadSummaryLoading && !threadSummaryError && threadSummaryData) {
          setCounts(getCounts(threadSummaryData.activity.threadSummary));
        }
      },
    });

  const { data: threadSummarySubscription } =
    useThreadActivitySummarySubscription({
      variables: {
        pageContext,
        partialMatch: !!locationFilter?.partialMatch,
        metadata,
        viewer: viewerFilter,
        resolved,
        _externalOrgID: groupID,
      },
    });

  useEffect(() => {
    if (threadSummarySubscription) {
      setCounts(getCounts(threadSummarySubscription.threadActivitySummary));
    }
  }, [threadSummarySubscription]);

  return counts;
}
