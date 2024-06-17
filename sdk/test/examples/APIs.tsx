import { useCallback, useRef, useState } from 'react';
import {
  Composer,
  ThreadList,
  ThreadedComments,
  thread,
} from '@cord-sdk/react';
import type { ResolvedStatus } from '@cord-sdk/types';
import type { Location } from 'common/types/index.ts';
import { isValidMetadata } from 'common/types/index.ts';

const DEFAULTS = {
  metadata: { foo: 'bar' },
  location: {
    partialMatch: false,
    value: { page: 'testbed' },
  },
  resolvedStatus: undefined,
  organizationID: undefined,
};

export function CordApisPlayground() {
  const [location, setLocation] = useState<Location | undefined>();
  const locationInputRef = useRef<HTMLInputElement>(null);
  const [organizationID, setOrganizationID] = useState<string | undefined>();
  const orgInputRef = useRef<HTMLInputElement>(null);
  const partialMatchInputRef = useRef<HTMLInputElement>(null);
  const metadataInputRef = useRef<HTMLInputElement>(null);
  const resolvedStatusRef = useRef<HTMLSelectElement>(null);

  const [metadata, setMetadata] = useState();
  const [partialMatch, setPartialMatch] = useState(
    DEFAULTS.location.partialMatch,
  );
  const [resolvedStatus, setResolvedStatus] = useState<
    ResolvedStatus | undefined
  >(DEFAULTS.resolvedStatus);

  const updateMetadata = useCallback(() => {
    const metaInput = metadataInputRef.current?.value;
    if (metaInput && !isValidMetadata(JSON.parse(metaInput))) {
      metadataInputRef.current?.setCustomValidity('Invalid metadata');
      metadataInputRef.current?.reportValidity();
      return;
    }
    setMetadata(metaInput ? JSON.parse(metaInput) : undefined);
  }, []);

  const updateLocation = useCallback(() => {
    const locationInput = locationInputRef.current?.value;
    if (locationInput && !isValidMetadata(JSON.parse(locationInput))) {
      locationInputRef.current?.setCustomValidity('Invalid metadata');
      locationInputRef.current?.reportValidity();
      return;
    }
    setLocation(locationInput ? JSON.parse(locationInput) : undefined);
  }, []);

  const updateOrg = useCallback(() => {
    const orgInput = orgInputRef.current?.value
      ? orgInputRef.current?.value
      : undefined;
    setOrganizationID(orgInput);
  }, []);

  const updatePartialMatch = useCallback(() => {
    const partialMatchValue =
      partialMatchInputRef.current?.checked || DEFAULTS.location.partialMatch;
    setPartialMatch(partialMatchValue);
  }, []);
  const updateResolvedStatus = useCallback(() => {
    const resolvedStatusValue = resolvedStatusRef.current?.value;
    setResolvedStatus(resolvedStatusValue as ResolvedStatus);
  }, []);

  const updateFilters = () => {
    updateMetadata();
    updatePartialMatch();
    updateResolvedStatus();
    updateLocation();
    updateOrg();
  };

  const locationSummary = thread.useLocationSummary(
    location ?? DEFAULTS.location.value,
    {
      partialMatch,
    },
  );
  const threadCounts = thread.useThreadCounts({
    filter: {
      location: location && {
        partialMatch,
        value: location,
      },
      metadata,
      resolvedStatus,
      groupID: organizationID,
    },
  });

  const threadLocationData = thread.useLocationData(
    location ?? DEFAULTS.location.value,
    {
      partialMatch,
      filter: {
        location: location,
        metadata,
        resolvedStatus,
        groupID: organizationID,
      },
    },
  );
  const threadsData = thread.useThreads({
    filter: {
      location: location && {
        partialMatch,
        value: location,
      },
      metadata,
      resolvedStatus,
      groupID: organizationID,
    },
  });

  return (
    <div
      className="component-example"
      style={{
        fontFamily: 'Roboto, sans-serif',
        backgroundColor: '#f4f7f9',
        padding: '2em',
        borderRadius: '8px',
        boxShadow:
          '0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div>
        Filters:
        <label htmlFor="cord-api-metadata">metadata:</label>
        <input
          id="cord-api-metadata"
          ref={metadataInputRef}
          type="text"
          placeholder={`{ "key": "value" }`}
        />{' '}
        <label htmlFor="cord-api-partial-match">partial match:</label>
        <input
          id="cord-api-partial-match"
          ref={partialMatchInputRef}
          type="checkbox"
        />{' '}
        <label htmlFor="cord-api-resolved-status">resolved status:</label>
        <select id="cord-api-resolved-status" ref={resolvedStatusRef}>
          <option value="any">Any</option>
          <option value="resolved">Resolved</option>
          <option value="unresolved">Unresolved</option>
        </select>{' '}
        <label htmlFor="cord-api-location">Location:</label>
        <input
          id="cord-api-location"
          ref={locationInputRef}
          placeholder={`{ "page": "testbed" }`}
        />{' '}
        <label htmlFor="cord-api-org">organizationID:</label>
        <input
          id="cord-api-org"
          ref={orgInputRef}
          placeholder={`secondOrg`}
        />{' '}
        <button
          onClick={updateFilters}
          type="button"
          style={{
            fontSize: '16px',
            backgroundColor: '#0088a9',
            color: '#fff',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
          }}
        >
          Save
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div>
            <h3>API: thread.useLocationSummary()</h3>
            <p>
              Stats for location:{' '}
              {JSON.stringify(location ?? DEFAULTS.location.value)}{' '}
              {partialMatch ? 'with partial matching' : ''}
            </p>
            {locationSummary && (
              <ul>
                <span>Data from locationSummary</span>
                <li>total threads: {locationSummary.total}</li>
                <li>unread threads: {locationSummary.unread}</li>
                <li>
                  unread subscribed threads: {locationSummary.unreadSubscribed}
                </li>
                <li>resolved threads: {locationSummary.resolved}</li>
                <li>new threads: {locationSummary.new}</li>
                <li>empty threads: {locationSummary.empty}</li>
              </ul>
            )}
            <h3>API: thread.useThreadCounts()</h3>
            <p>
              Stats for location: {JSON.stringify(location)}{' '}
              {partialMatch ? 'with partial matching' : ''}
            </p>
            {threadCounts && (
              <ul>
                <span>Data from threadCounts</span>
                <li>total threads: {threadCounts.total}</li>
                <li>unread threads: {threadCounts.unread}</li>
                <li>
                  unread subscribed threads: {threadCounts.unreadSubscribed}
                </li>
                <li>resolved threads: {threadCounts.resolved}</li>
                <li>new threads: {threadCounts.new}</li>
                <li>empty threads: {threadCounts.empty}</li>
              </ul>
            )}
          </div>

          <div>
            <h3>API: thread.useLocationData()</h3>
            <p>
              Stats for location: {JSON.stringify(location)}{' '}
              {partialMatch ? 'with partial matching' : ''}
            </p>
            {threadLocationData && (
              <ul>
                <li>Length of list: {threadLocationData.threads.length}</li>
                <li>
                  loading: {threadLocationData.loading ? 'true' : 'false'}
                </li>
                <li>
                  hasMore: {threadLocationData.hasMore ? 'true' : 'false'}
                </li>
                <li>
                  {threadLocationData.hasMore && (
                    <button
                      onClick={() => void threadLocationData.fetchMore(5)}
                      type="button"
                    >
                      Fetch 5 more
                    </button>
                  )}
                </li>
              </ul>
            )}
          </div>
          <div>
            <h3>API: thread.useThreads()</h3>
            <p>
              Stats for location: {JSON.stringify(location)}{' '}
              {partialMatch ? 'with partial matching' : ''}
            </p>
            {threadsData && (
              <ul>
                <li>Length of list: {threadsData.threads.length}</li>
                <li>loading: {threadsData.loading ? 'true' : 'false'}</li>
                <li>hasMore: {threadsData.hasMore ? 'true' : 'false'}</li>
                <ul>
                  <span>Data from counts object:</span>
                  <li>total threads: {threadsData.counts?.total}</li>
                  <li>unread threads: {threadsData.counts?.unread}</li>
                  <li>
                    unread subscribed threads:{' '}
                    {threadsData.counts?.unreadSubscribed}
                  </li>
                  <li>resolved threads: {threadsData.counts?.resolved}</li>
                  <li>new threads: {threadsData.counts?.new}</li>
                  <li>empty threads: {threadsData.counts?.empty}</li>
                </ul>
                <li>
                  {threadsData.hasMore && (
                    <button
                      onClick={() => void threadsData.fetchMore(5)}
                      type="button"
                    >
                      Fetch 5 more
                    </button>
                  )}
                </li>
              </ul>
            )}
          </div>
          <h3>create a new message with the right filters</h3>
          <Composer
            location={location}
            autofocus
            threadName="Sent from my testbed composer"
            showCloseButton={true}
            size={'small'}
            messageMetadata={metadata}
          />
        </div>
        <div>
          <p>
            location: {JSON.stringify(location ?? DEFAULTS.location.value)}{' '}
            organization: {organizationID} partialMatch: {`${partialMatch}`}
          </p>
          <ThreadedComments
            location={location ?? DEFAULTS.location.value}
            messageOrder="newest_on_top"
            composerPosition="top"
            topLevelComposerExpanded
            displayResolved="tabbed"
            filter={{
              location: location ?? DEFAULTS.location.value,
              metadata,
              groupID: organizationID,
            }}
          />
          <ThreadList
            location={location ?? DEFAULTS.location.value}
            style={{
              maxHeight: '400px', // Recommended so that long threads scroll instead of disappearing off-screen
              width: '300px', // Recommended so that threads don't stretch horizontally based on their content
            }}
          />
        </div>
      </div>
    </div>
  );
}
