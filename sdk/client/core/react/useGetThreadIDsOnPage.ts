import { useState, useEffect, useRef, useMemo } from 'react';
import {
  PageThreadAddedTypeName,
  ThreadFilterablePropertiesMatchTypeName,
  ThreadFilterablePropertiesUnmatchTypeName,
  PageThreadReplyAddedTypeName,
  PageThreadResolvedTypeName,
  PageThreadUnresolvedTypeName,
  PageVisitorsUpdatedTypeName,
  getResolvedFromStatus,
  getViewerThreadFilter,
  PageThreadDeletedTypename,
} from 'common/types/index.ts';
import type { ThreadListFilter } from 'common/types/index.ts';
import type {
  ThreadData,
  ThreadsDataContextType,
} from 'external/src/context/threads2/ThreadsContext2.tsx';
import {
  ThreadsContext2,
  ThreadsDataContext2,
  threadFragmentToThreadData,
} from 'external/src/context/threads2/ThreadsContext2.tsx';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { extractUsersFromThread2 } from 'external/src/context/users/util.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import {
  useThreadListQuery,
  useThreadListEventsWithLocationSubscription,
} from 'external/src/graphql/operations.ts';
import type { ThreadSortInput } from 'server/src/schema/resolverTypes.ts';
import { batchReactUpdates } from 'external/src/lib/util.ts';
import type { PaginationParams, ResolvedStatus } from '@cord-sdk/types';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';
import { useMemoObject } from '@cord-sdk/react/hooks/useMemoObject.ts';
import { internalThreadMatchesFilter } from 'sdk/client/core/filter.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';

// There's two ways of passing down locations from the API - through
// a filter and as a property within the main props. Until we change
// our external code to only accept the one in the filter object,
// we've tried to make sure there's only one way to pass the location prop
// internally and reduce any confusion.

//This is one place where we've changed out internal code to only
// accept location only from one prop.
export function useGetThreadIDsOnPage({
  filter,
  partialMatch,
  sort,
  initialPageSize,
}: {
  // We have tripped over the optional resolvedStatus before.
  // So we decided to make this a required field for our internal
  // API, since we must set it for gql.
  // Also, groupID is passed through OrgOverrideContext, not here
  filter: Omit<ThreadListFilter, 'resolvedStatus' | 'groupID'> & {
    resolvedStatus: ResolvedStatus;
  };
  partialMatch: boolean;
  sort: ThreadSortInput;
  initialPageSize?: number;
}): { threadIDs: string[] | undefined } & PaginationParams {
  // keep threadIDs both as Set and List to make the check of whether a
  // threadID is new cheap
  const [threadIDs, setThreadIDs] = useState<
    { asList: string[]; asSet: Set<string> } | undefined
  >(undefined);
  const threadIDsMightHaveGaps = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const [paginationToken, setPaginationToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { mergeThread, localOnlyThreadIDs } =
    useContextThrowingIfNoProvider(ThreadsContext2);
  const { user } = useContextThrowingIfNoProvider(IdentityContext);
  const {
    addUsers,
    byInternalID: { requestUsers, userByID: userByInternalID },
  } = useContextThrowingIfNoProvider(UsersContext);
  const threadDataContext = useContextThrowingIfNoProvider(ThreadsDataContext2);

  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);

  const { location, resolvedStatus, metadata, viewer, ...rest } = filter;
  const _: Record<string, never> = rest;

  const resolved = getResolvedFromStatus(resolvedStatus);
  const viewerFilter = getViewerThreadFilter(viewer);
  const queryVars = {
    location,
    resolved,
    // Unfortunately we have to specify the metadata property to make ts happy
    // with our ThreadFilterInput type from GraphQL and ThreadListFilter from
    // our types package.
    filter: { metadata, viewer: viewerFilter },
    partialMatch,
    sort,
    _externalOrgID: organization?.externalID ?? null,
  };

  const {
    loading: pageThreadsLoading,
    error: pageThreadsError,
    refetch: pageThreadsRefetch,
  } = useThreadListQuery({
    variables: {
      ...queryVars,
      limit: initialPageSize,
      after: null,
    },
    onCompleted: (pageThreadsData) => {
      if (!pageThreadsLoading && !pageThreadsError && pageThreadsData) {
        batchReactUpdates(() => {
          const {
            threads: newThreads,
            hasMore: newHasMore,
            token: newToken,
          } = pageThreadsData.threadsAtLocation;

          setHasMore(newHasMore);
          setPaginationToken(newToken);
          setLoading(false);

          newThreads.map((t) =>
            extractUsersFromThread2(t, addUsers, requestUsers),
          );

          const newThreadFragments = newThreads
            // don't filter out empty threads, they still can receive a message at
            // which point that thread needs to be rendered
            .map(threadFragmentToThreadData);

          // the thread might already exist in the the context, hence we "merge in"
          // each thread instead of using "setThreads"
          newThreadFragments.forEach((thread) => mergeThread(thread));

          const newThreadIDs = newThreads.map((t) => t.id);
          const oldAsList = threadIDs?.asList ?? [];

          // In the common case, we won't have any gaps in the thread IDs, in
          // which case we can heedlessly mash the two lists together (since
          // items within each page already take `sort` into account). But if
          // we've somehow ended up with a potential gap or discontinuity, we
          // have to do a full sort of everything together since the two lists
          // could end up interleaved.
          let newAsList = [...oldAsList, ...newThreadIDs];
          if (threadIDsMightHaveGaps.current) {
            newAsList = sortThreadIDs(
              newAsList,
              threadDataContext,
              newThreadFragments,
              sort,
            );
          }
          setThreadIDs({
            asList: newAsList,
            asSet: new Set(newAsList),
          });
        });
      }
    },
    notifyOnNetworkStatusChange: true, // Needed to make onCompleted be called again when refetch is called.
  });

  const fetchMore = async (howMany: number) => {
    if (loading) {
      console.warn('Cannot fetch more threads while already loading');
      return;
    }
    setLoading(true);
    await pageThreadsRefetch({
      ...queryVars,
      limit: howMany,
      after: paginationToken,
    });
  };

  const { data: subscriptionWithLocationData } =
    useThreadListEventsWithLocationSubscription({
      variables: {
        location,
        partialMatch,
        resolved,
        filter: { metadata, viewer: viewerFilter },
        _externalOrgID: organization?.externalID ?? null,
      },
    });
  const lastProcessedEventRef = useRef<typeof subscriptionWithLocationData>();

  useEffect(() => {
    if (subscriptionWithLocationData) {
      // Ensure we don't process the same event twice because some other
      // dependency changed
      if (lastProcessedEventRef.current === subscriptionWithLocationData) {
        return;
      }
      lastProcessedEventRef.current = subscriptionWithLocationData;

      const eventTypename =
        subscriptionWithLocationData.pageEventsWithLocation.__typename;
      switch (eventTypename) {
        case PageThreadAddedTypeName: {
          if (!subscriptionWithLocationData.pageEventsWithLocation.thread) {
            return;
          }
          extractUsersFromThread2(
            subscriptionWithLocationData.pageEventsWithLocation.thread,
            addUsers,
            requestUsers,
          );
          mergeThread(
            threadFragmentToThreadData(
              subscriptionWithLocationData.pageEventsWithLocation.thread,
            ),
          );
          const threadID =
            subscriptionWithLocationData.pageEventsWithLocation.thread.id;
          setThreadIDs((oldThreadIDs) => {
            if (!oldThreadIDs) {
              // this shouldn't happen: subscription data came before the main
              // query data
              return oldThreadIDs;
            }
            if (oldThreadIDs.asSet.has(threadID)) {
              // we are aware of this thread already
              return oldThreadIDs;
            }
            if (sort?.sortDirection === 'ascending' && hasMore) {
              // Would go at the end of the list, but we haven't paginated there
              // yet. Do nothing, the pagination will pick it up when we get
              // there.
              return oldThreadIDs;
            }
            return {
              asSet: new Set(oldThreadIDs.asSet).add(threadID),
              // A brand-new thread is "newest" by both sorting criteria, so all
              // we need to check is if it goes first or last in the list based
              // on the direction.
              asList:
                sort?.sortDirection === 'ascending'
                  ? [...oldThreadIDs.asList, threadID]
                  : [threadID, ...oldThreadIDs.asList],
            };
          });

          break;
        }
        case PageThreadResolvedTypeName:
        case PageThreadUnresolvedTypeName:
        case PageVisitorsUpdatedTypeName:
          // Don't need to do anything -- server isn't supposed to generate
          // these events for this subscription anyway.
          break;
        case PageThreadReplyAddedTypeName: {
          break;
        }
        case PageThreadDeletedTypename:
        case ThreadFilterablePropertiesUnmatchTypeName: {
          const threadIDToRemove =
            subscriptionWithLocationData.pageEventsWithLocation.id;
          if (threadIDs?.asSet.has(threadIDToRemove)) {
            setThreadIDs((oldThreadIDs) => {
              const newThreadIDs = new Set(oldThreadIDs?.asSet);
              newThreadIDs.delete(threadIDToRemove);
              // TODO: I don't think we actually need to sort here, just remove
              // the oldThreadIDs from the list?
              const newThreadIDsAsList = sortThreadIDs(
                [...newThreadIDs],
                threadDataContext,
                [],
                sort,
              );
              return {
                asList: newThreadIDsAsList,
                asSet: newThreadIDs,
              };
            });
          }
          break;
        }
        case ThreadFilterablePropertiesMatchTypeName: {
          const matchThreadID =
            subscriptionWithLocationData.pageEventsWithLocation.thread.id;
          if (threadIDs?.asSet?.has(matchThreadID)) {
            // We already know about this thread, so we don't need to do
            // anything.  (Any updates to the thread's properties will be
            // handled by the ThreadSubscriber)
            break;
          }

          const matchThreadData = threadFragmentToThreadData(
            subscriptionWithLocationData.pageEventsWithLocation.thread,
          );
          mergeThread(matchThreadData);
          setThreadIDs((oldThreadIDs) => {
            const newThreadIDs = new Set(oldThreadIDs?.asSet);
            newThreadIDs.add(matchThreadID);
            const newThreadIDsAsList = sortThreadIDs(
              [...newThreadIDs],
              threadDataContext,
              [matchThreadData],
              sort,
            );
            threadIDsMightHaveGaps.current = true;
            return {
              asList: newThreadIDsAsList,
              asSet: newThreadIDs,
            };
          });

          break;
        }

        default: {
          // Have TS ensure switch is exhaustive.
          const _typeName: never = eventTypename;
          break;
        }
      }
    }
  }, [
    addUsers,
    requestUsers,
    mergeThread,
    subscriptionWithLocationData,
    sort,
    hasMore,
    resolved,
    userByInternalID,
    threadDataContext,
    filter,
    threadIDs?.asSet,
  ]);

  const threadIDsToReturn = useMemo(() => {
    if (!threadIDs) {
      return undefined;
    }
    // Hack, hack, hack!
    // We optimistically update the resolved boolean on ThreadsContext2,
    // however useGetThreadIDsOnPage does not share a state with
    // ThreadsContext2. So it will only update the resolved threads
    // once the subscription event comes through. Here, we are
    // filtering using the context thread state, so the updates
    // come through asap.
    const updatedThreadIDs =
      resolved === undefined
        ? [...threadIDs.asList]
        : threadIDs.asList.filter(
            (t) =>
              threadDataContext[t] &&
              threadDataContext[t].resolved === resolved,
          );
    // And merge in any local-only threads until they appear on the subscription
    if (localOnlyThreadIDs.length > 0) {
      let anyAdded = false;
      for (const threadID of localOnlyThreadIDs) {
        if (
          internalThreadMatchesFilter(threadDataContext[threadID], user, {
            ...filter,
            // The type of location differs between the two filters
            ...(location && { location: { value: location, partialMatch } }),
          })
        ) {
          updatedThreadIDs.push(threadID);
          anyAdded = true;
        }
      }
      if (anyAdded) {
        sortThreadIDs(updatedThreadIDs, threadDataContext, [], sort);
      }
    }
    return updatedThreadIDs;
  }, [
    filter,
    localOnlyThreadIDs,
    location,
    partialMatch,
    resolved,
    sort,
    threadDataContext,
    threadIDs,
    user,
  ]);

  const memoThreadIDs = useMemoObject(threadIDsToReturn);

  return {
    threadIDs: memoThreadIDs,
    loading,
    hasMore,
    fetchMore,
  };
}

function sortThreadIDs(
  threadIDs: string[],
  contextData: ThreadsDataContextType,
  // mergeThread doesn't take effect until next render cycle but we need the
  // data here to sort properly.
  mergedData: ThreadData[],
  sort: ThreadSortInput,
) {
  const data = { ...contextData };
  mergedData.forEach((t) => (data[t.id] = t));

  const dir = sort.sortDirection === 'ascending' ? 1 : -1;

  return threadIDs.sort((a, b) => {
    const dataA = data[a];
    const dataB = data[b];
    const validA = dataA && dataA.messages.length > 0;
    const validB = dataB && dataB.messages.length > 0;
    // No matter the ordering, all empty or unknown threads go to the end of the
    // list
    if (!validA && !validB) {
      return 0;
    }
    if (!validA) {
      return -1;
    }
    if (!validB) {
      return 1;
    }
    switch (sort.sortBy) {
      case 'first_message_timestamp':
        return (
          dir *
          dataA.messages[0].timestamp.localeCompare(dataB.messages[0].timestamp)
        );
      case 'most_recent_message_timestamp':
        return (
          dir *
          dataA.messages[dataA.messages.length - 1].timestamp.localeCompare(
            dataB.messages[dataB.messages.length - 1].timestamp,
          )
        );
    }
  });
}
