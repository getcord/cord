/** @jsxImportSource @emotion/react */

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { experimental, thread, betaV2 } from '@cord-sdk/react';
import type { HTMLCordThreadElement } from '@cord-sdk/types';
import {
  isValidLocation,
  outerHTMLOnly,
  unescapeXMLQuotes,
} from 'sdk/test/utils.ts';
import { isValidMetadata } from 'common/types/index.ts';
import { useThreads } from '@cord-sdk/react/hooks/thread.ts';
import { Threads } from '@cord-sdk/react/experimental.ts';

const DEFAULTS = {
  threadID: 'abc123',
  threadName: '',
  metadata: undefined,
  location: { page: 'testbed' },
  collapsed: false,
  showHeader: true,
  composerExpanded: true,
  groupID: 'cord',
};

const DebugAvatar = forwardRef(
  (props: betaV2.AvatarProps, ref: React.Ref<HTMLElement>) => {
    const ids = betaV2.useCordIDs();
    return (
      <div
        onClick={() =>
          // eslint-disable-next-line no-alert -- This is a test file
          window.alert(`
thread: ${ids.thread}
message: ${ids.message}
author: ${ids.user}
`)
        }
      >
        <betaV2.Avatar ref={ref} {...props} />
      </div>
    );
  },
);

const MyAvatarTooltip = (props: betaV2.AvatarTooltipProps) => {
  const ids = betaV2.useCordIDs();
  return (
    <div>
      <betaV2.AvatarTooltip {...props} />
      <ul>
        <li>{ids.user}</li>
        <li>{ids.thread}</li>
        <li>{ids.message}</li>
      </ul>
    </div>
  );
};
const REPLACE = {
  Avatar: DebugAvatar,
  AvatarTooltip: MyAvatarTooltip,
} satisfies betaV2.ReplaceConfig;

function MyEmojiPicker({ onClickEmoji }: betaV2.EmojiPickerProps) {
  return (
    <div>
      <button type="button" onClick={() => onClickEmoji('⬆️')}>
        upvote{' '}
      </button>
      <button type="button" onClick={() => onClickEmoji('⬇️')}>
        downvote
      </button>
    </div>
  );
}

export function CordThreadCanaryExample() {
  const locationInputRef = useRef<HTMLInputElement>(null);
  const threadIDInputRef = useRef<HTMLInputElement>(null);
  const threadNameInputRef = useRef<HTMLInputElement>(null);
  const threadMetadataInputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLCordThreadElement>(null);

  const [threadID, setThreadID] = useState(DEFAULTS.threadID);
  const [threadName, setThreadName] = useState(DEFAULTS.threadName);
  const [metadata, setMetadata] = useState(DEFAULTS.metadata);
  const [location, setLocation] = useState(DEFAULTS.location);

  const [code, setCode] = useState<string | undefined>();
  const updateThreadID = useCallback(
    () => setThreadID(threadIDInputRef.current?.value || DEFAULTS.threadID),
    [],
  );
  const updateThreadName = useCallback(
    () =>
      setThreadName(threadNameInputRef.current?.value || DEFAULTS.threadName),
    [],
  );
  const updateMetadata = useCallback(() => {
    const metadataInput = threadMetadataInputRef.current?.value;

    if (metadataInput && !isValidMetadata(JSON.parse(metadataInput))) {
      threadMetadataInputRef.current?.setCustomValidity('Invalid metadata');
      threadMetadataInputRef.current?.reportValidity();
      return;
    }

    setMetadata(metadataInput ? JSON.parse(metadataInput) : DEFAULTS.metadata);
  }, []);
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

  const updateCreationParams = () => {
    updateThreadID();
    updateThreadName();
    updateMetadata();
    updateLocation();
  };

  useEffect(() => {
    setCode(outerHTMLOnly(threadRef.current));
  }, [threadID, threadName, metadata, location]);

  const threadData = thread.useThread(threadID);
  const threadSummary = thread.useThreadSummary(threadID);
  const threadsData = useThreads({
    filter: { location: { value: {}, partialMatch: true } },
  });

  const [currentTabOne, setCurrentTabOne] = useState('unresolved');
  const resolvedStatusTabbedThreadsProps: experimental.TabbedThreadsProps =
    useMemo(() => {
      return {
        tabbedThreadsOptions: [
          {
            name: 'unresolved',
            threadsOptions: {
              options: { filter: { resolvedStatus: 'unresolved' } },
              composerOptions: { position: 'bottom', groupID: 'cord' },
            },
          },
          {
            name: 'resolved',
            threadsOptions: {
              options: { filter: { resolvedStatus: 'resolved' } },
            },
          },
        ],
        currentTab: currentTabOne,
        onChangeTab: setCurrentTabOne,
      };
    }, [currentTabOne]);

  const [currentTabTwo, setCurrentTabTwo] = useState('cord');

  const groupIDTabbedThreadsProps: experimental.TabbedThreadsProps =
    useMemo(() => {
      return {
        tabbedThreadsOptions: [
          {
            name: 'cord',
            threadsOptions: {
              options: { filter: { groupID: 'cord' } },
              composerOptions: { position: 'bottom', groupID: 'cord' },
            },
          },
          {
            name: 'secondorg',
            threadsOptions: {
              options: { filter: { groupID: 'secondorg' } },
              composerOptions: { position: 'bottom', groupID: 'secondorg' },
            },
          },
          {
            name: 'thirdorg',
            threadsOptions: {
              options: { filter: { groupID: 'thirdorg' } },
              composerOptions: { position: 'bottom', groupID: 'thirdorg' },
            },
          },
        ],
        currentTab: currentTabTwo,
        onChangeTab: setCurrentTabTwo,
      };
    }, [currentTabTwo]);
  return (
    <betaV2.Replace replace={REPLACE}>
      <div className="component-example">
        <label htmlFor="cord-thread-location">location:</label>
        <input
          id="cord-thread-location"
          ref={locationInputRef}
          onInput={onLocationInput}
          type="text"
          placeholder={JSON.stringify(DEFAULTS.location)}
        />

        <label htmlFor="cord-thread-thread-id">thread-id:</label>
        <input
          id="cord-thread-thread-id"
          ref={threadIDInputRef}
          type="text"
          placeholder={DEFAULTS.threadID}
        />

        <label htmlFor="cord-thread-thread-name">thread-name:</label>
        <input
          id="cord-thread-thread-name"
          ref={threadNameInputRef}
          type="text"
          placeholder="(page name / default)"
        />

        <label htmlFor="cord-thread-thread-metadata">thread-metadata:</label>
        <input
          id="cord-thread-thread-metadata"
          ref={threadMetadataInputRef}
          type="text"
          placeholder={`{ "status": "open", "isFavorite": true }`}
        />

        <button onClick={updateCreationParams} type="button">
          Save
        </button>

        <code>{unescapeXMLQuotes(code || '')}</code>

        <div style={{ gridColumn: '1' }}>Add reaction to first message</div>
        {threadSummary?.firstMessage && (
          <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
            <betaV2.Reactions
              threadID={threadID}
              messageID={threadSummary.firstMessage.id}
              replace={{
                EmojiPicker: MyEmojiPicker,
              }}
            />
          </div>
        )}

        <>
          <div style={{ gridColumn: '1 / -1' }}>
            Canary message
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto auto',
                gap: 12,
              }}
            >
              <span>By message info</span>
              <span>By message ID</span>
              {threadSummary?.firstMessage ? (
                <betaV2.Message message={threadSummary?.firstMessage} />
              ) : (
                <div>No message data</div>
              )}
              {threadSummary?.firstMessage ? (
                <betaV2.Message.ByID
                  messageID={threadSummary?.firstMessage.id}
                />
              ) : (
                <div>No message data</div>
              )}
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            Canary Threads
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto auto',
                gap: 12,
              }}
            >
              <span>By thread data</span>
              <span>By thread options</span>
              <Threads
                threadsData={threadsData}
                style={{ maxHeight: '450px', maxWidth: '300px' }}
                composerOptions={{
                  position: 'top',
                  groupID: DEFAULTS.groupID,
                }}
              />
              <Threads.ByOptions
                options={{
                  filter: { resolvedStatus: 'resolved' },
                }}
                style={{ maxHeight: '450px', maxWidth: '300px' }}
              />
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            Canary Tabbed Threads resolved and unresolved
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto auto',
                gap: 12,
              }}
            >
              <span>By resolved status</span>
              <span>By group ID</span>
              <experimental.TabbedThreads
                {...resolvedStatusTabbedThreadsProps}
                style={{ height: 400, width: 300 }}
              />
              <experimental.TabbedThreads
                {...groupIDTabbedThreadsProps}
                style={{ height: 400, width: 300 }}
              />
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            Canary thread
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto auto',
                gap: 12,
              }}
            >
              <span>By thread info</span>
              <span>By thread ID</span>
              <betaV2.Thread
                threadData={threadData}
                showHeader={true}
                style={{ maxHeight: '400px' }}
              />
              {threadData.thread ? (
                <betaV2.Thread.ByID
                  threadID={threadData.thread.id}
                  showHeader={true}
                  style={{ maxHeight: '400px' }}
                />
              ) : (
                <div>No thread data</div>
              )}
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            Canary send composer
            <betaV2.SendComposer
              autofocus
              threadID={threadID}
              placeholder="this is a placeholder"
            />
          </div>
        </>
      </div>
    </betaV2.Replace>
  );
}
