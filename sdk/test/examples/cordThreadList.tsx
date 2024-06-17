import { useRef, useState, useCallback, useEffect } from 'react';
import { createUseStyles } from 'react-jss';
import { FloatingThreads, ThreadList } from '@cord-sdk/react';
import {
  isValidFilter,
  isValidLocation,
  outerHTMLOnly,
  unescapeXMLQuotes,
} from 'sdk/test/utils.ts';
import type {
  HTMLCordFloatingThreadsElement,
  ThreadSummary,
} from '@cord-sdk/types';

const DEFAULTS = {
  location: { page: 'testbed' },
  filter: { metadata: {} },
};

const useStyles = createUseStyles({
  threadList: {
    height: '300px',
    background: 'white',
  },
});

export function CordThreadListExample({
  floatingThreadsElementRef,
}: {
  floatingThreadsElementRef: React.MutableRefObject<HTMLCordFloatingThreadsElement | null>;
}) {
  const classes = useStyles();
  const locationInputRef = useRef<HTMLInputElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);
  const threadListRef = useRef<HTMLElement>(null);

  const [location, setLocation] = useState(DEFAULTS.location);
  const [filter, setFilter] = useState(DEFAULTS.filter);
  const [code, setCode] = useState<string | undefined>();
  const [lastThreadIDClicked, setLastThreadIDClicked] = useState<string | null>(
    null,
  );

  const setLastThreadIDClickedAndOpenFloatingThread = (
    threadID: string,
    threadSummary: ThreadSummary,
  ) => {
    floatingThreadsElementRef?.current?.openThread(threadSummary.id);
    setLastThreadIDClicked(threadSummary.id);
  };
  const [partialMatch, setPartialMatch] = useState(false);
  const [highlightThreadExternalID, setHighlightThreadExternalID] =
    useState<string>('');

  const updateLocation = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    const location = locationInputRef.current?.value;
    if (location && !isValidLocation(location)) {
      locationInputRef.current?.setCustomValidity('Invalid location');
      locationInputRef.current?.reportValidity();
      return;
    }
    setLocation(location ? JSON.parse(location) : DEFAULTS.location);
  }, []);
  const onLocationInput = useCallback(() => {
    locationInputRef.current?.setCustomValidity('');
  }, []);

  const updateFilter = useCallback(() => {
    const newFilter = filterInputRef.current?.value;
    if (newFilter && !isValidFilter(newFilter)) {
      filterInputRef.current?.setCustomValidity('Invalid filter');
      filterInputRef.current?.reportValidity();
      return;
    }
    setFilter(newFilter ? JSON.parse(newFilter) : DEFAULTS.filter);
  }, []);

  const onFilterInput = useCallback(() => {
    filterInputRef.current?.setCustomValidity('');
  }, []);

  useEffect(() => {
    setCode(outerHTMLOnly(threadListRef.current));
  }, [location, filter]);

  const [ready, setReady] = useState(false);

  return (
    <>
      <div className="component-example">
        <h3>Floating threads</h3>
        <FloatingThreads
          location={location}
          buttonLabel={'Create a new floating thread yo'}
          threadName="Lorem Ipsum paragraph"
          showScreenshotPreview={true}
        />
      </div>
      <div className="component-example">
        <h3>Cord thread list</h3>
        <label htmlFor="cord-thread-list-location">location:</label>
        <input
          id="cord-thread-list-location"
          ref={locationInputRef}
          onInput={onLocationInput}
          type="text"
          placeholder={JSON.stringify(DEFAULTS.location)}
        />
        <button onClick={updateLocation} type="button">
          Update location
        </button>
        <label htmlFor="cord-thread-list-filter">filter:</label>
        <input
          id="cord-thread-list-filter"
          ref={filterInputRef}
          onInput={onFilterInput}
          type="text"
          placeholder={JSON.stringify(DEFAULTS.filter)}
        />
        <button onClick={updateFilter} type="button">
          Update filter
        </button>

        <code>{unescapeXMLQuotes(code || '')}</code>

        <label>
          <input
            type="checkbox"
            checked={partialMatch}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPartialMatch(e.target.checked)
            }
          />
          Enable partial matching
        </label>

        <label htmlFor="cord-thread-list-highlight">highlight thread:</label>
        <input
          id="cord-thread-list-highlight"
          value={highlightThreadExternalID}
          onChange={(e) => setHighlightThreadExternalID(e.target.value)}
          type="text"
          placeholder="Type in externalID of thread"
        />

        <p style={{ gridColumn: '1 / -1' }}>
          Last clicked thread was: {lastThreadIDClicked}
        </p>

        {!ready && (
          <div className="threadListLoading">
            <p>Loading...</p>
          </div>
        )}

        <ThreadList
          style={{ display: ready ? 'block' : 'none' }}
          className={classes.threadList}
          forwardRef={threadListRef}
          location={location}
          filter={filter}
          partialMatch={partialMatch}
          onThreadClick={setLastThreadIDClickedAndOpenFloatingThread}
          onLoading={() => setReady(false)}
          onRender={() => setReady(true)}
          highlightThreadId={highlightThreadExternalID}
        />
      </div>
    </>
  );
}
