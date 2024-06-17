import { isEqual, unique } from 'radash';
import {
  getLocationFilter,
  getViewerThreadFilter,
  locationEqual,
  locationMatches,
  metadataMatches,
} from 'common/types/index.ts';
import type { UserFragment } from 'external/src/graphql/operations.ts';
import type { ThreadData } from 'external/src/context/threads2/ThreadsContext2.tsx';
import type {
  ThreadSummary,
  Location,
  ClientThreadFilter,
  LocationFilterOptions,
  ResolvedStatus,
  ClientUserData,
  ViewerThreadStatus,
} from '@cord-sdk/types';

export function internalThreadMatchesFilter(
  thread: ThreadData,
  viewer: UserFragment,
  filter: ClientThreadFilter | undefined = {},
): boolean {
  return threadMatchesFilter(
    {
      groupID: thread.externalOrgID,
      metadata: thread.metadata,
      location: thread.location,
      resolved: thread.resolved,
      // NOTE(flooey): We can't filter on any other subscribers, so we aren't
      // even attempting to pass them through here.
      subscribers: thread.subscribed ? [viewer.externalID] : [],
      mentioned: thread.mentioned.map((u) => u.externalID),
    },
    { id: viewer.externalID },
    filter,
  );
}

/**
 * Client side filtering for a thread.
 *
 * WARNING: Please opt to filter on the server-side in SQL whenever possible.
 * This should be a last resort.
 */
export function externalThreadMatchesFilter(
  thread: ThreadSummary,
  viewer: ClientUserData,
  filter: ClientThreadFilter | undefined = {},
): boolean {
  return threadMatchesFilter(thread, viewer, filter);
}

function threadMatchesFilter(
  thread: Pick<
    ThreadSummary,
    | 'groupID'
    | 'metadata'
    | 'location'
    | 'resolved'
    | 'subscribers'
    | 'mentioned'
  >,
  viewer: Pick<ClientUserData, 'id'>,
  filter: ClientThreadFilter,
): boolean {
  if (isEqual(filter, {})) {
    return true;
  }

  const {
    location,
    resolvedStatus,
    groupID,
    metadata,
    viewer: viewerFilter,
    ...rest
  } = filter;
  const _: Record<string, never> = rest;

  const filterLocation = getLocationFilter(location);
  const isGroupIdMatching = groupID ? thread.groupID === groupID : true;
  const isMetadataMatching = metadata
    ? metadataMatches(thread.metadata, metadata)
    : true;

  return (
    isGroupIdMatching &&
    isMetadataMatching &&
    isLocationMatching(thread.location, filterLocation) &&
    isResolvedStatusMatching(thread.resolved, resolvedStatus) &&
    isViewerStatusMatching(
      thread.subscribers,
      thread.mentioned,
      viewer,
      getViewerThreadFilter(viewerFilter),
    )
  );
}

function isLocationMatching(
  threadLocation: Location,
  filterLocation: LocationFilterOptions | undefined,
) {
  if (!filterLocation) {
    return true;
  }

  return filterLocation.partialMatch === true
    ? locationMatches(threadLocation, filterLocation.value)
    : locationEqual(threadLocation, filterLocation.value);
}

function isResolvedStatusMatching(
  threadResolvedStatus: boolean,
  filterResolvedStatus?: ResolvedStatus,
) {
  switch (filterResolvedStatus) {
    case 'any': {
      return true;
    }
    case 'resolved': {
      return threadResolvedStatus === true;
    }
    case 'unresolved': {
      return threadResolvedStatus === false;
    }
    case undefined: {
      return true;
    }
    default: {
      const _: never = filterResolvedStatus;
      return true;
    }
  }
}

function isViewerStatusMatching(
  subscribers: string[],
  mentioned: string[],
  viewer: Pick<ClientUserData, 'id'>,
  viewerFilter: ViewerThreadStatus[],
): boolean {
  if (viewerFilter.length === 0) {
    return true;
  }
  for (const status of unique(viewerFilter)) {
    switch (status) {
      case 'subscribed':
        if (subscribers.includes(viewer.id)) {
          return true;
        }
        break;
      case 'mentioned':
        if (mentioned.includes(viewer.id)) {
          return true;
        }
        break;
      default: {
        const _: never = status;
        throw new Error(`Unknown status: ${status}`);
      }
    }
  }
  return false;
}
