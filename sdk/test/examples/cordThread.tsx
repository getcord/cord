/** @jsxImportSource @emotion/react */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Reactions, Thread, thread, Timestamp, betaV2 } from '@cord-sdk/react';
import type { HTMLCordThreadElement, ThreadInfo } from '@cord-sdk/types';
import {
  isValidLocation,
  outerHTMLOnly,
  unescapeXMLQuotes,
} from 'sdk/test/utils.ts';
import { isValidMetadata } from 'common/types/index.ts';
import type { EmojiPickerProps } from '@cord-sdk/react/experimental/components/helpers/EmojiPicker.tsx';

const DEFAULTS = {
  threadID: 'abc123',
  threadName: '',
  metadata: undefined,
  location: { page: 'testbed' },
  collapsed: false,
  showHeader: true,
  composerExpanded: true,
};

function MyEmojiPicker({ onClickEmoji }: EmojiPickerProps) {
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

export function CordThreadExample() {
  const locationInputRef = useRef<HTMLInputElement>(null);
  const threadIDInputRef = useRef<HTMLInputElement>(null);
  const threadNameInputRef = useRef<HTMLInputElement>(null);
  const threadMetadataInputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLCordThreadElement>(null);

  const [threadID, setThreadID] = useState(DEFAULTS.threadID);
  const [threadName, setThreadName] = useState(DEFAULTS.threadName);
  const [metadata, setMetadata] = useState(DEFAULTS.metadata);
  const [location, setLocation] = useState(DEFAULTS.location);
  const [collapsed, setCollapsed] = useState(DEFAULTS.collapsed);
  const [showHeader, setShowHeader] = useState(DEFAULTS.showHeader);
  const [showThread, setShowThread] = useState(true);
  const [composerExpanded, setComposerExpanded] = useState(
    DEFAULTS.composerExpanded,
  );

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

  const [messageCount, setMessageCount] = useState<undefined | number>(
    undefined,
  );
  const onThreadInfoChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    ({ messageCount }: ThreadInfo) => setMessageCount(messageCount),
    [],
  );

  useEffect(() => {
    setCode(outerHTMLOnly(threadRef.current));
  }, [collapsed, threadID, threadName, metadata, location, showHeader]);

  const threadData = thread.useThread(threadID);

  return (
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

      <label htmlFor="cord-thread-collapsed">collapsed:</label>
      <input
        id="cord-thread-collapsed"
        type="checkbox"
        checked={collapsed}
        onChange={(e) => setCollapsed(e.target.checked)}
      />
      <label htmlFor="cord-thread-show">show thread:</label>
      <input
        id="cord-thread-show"
        type="checkbox"
        checked={showThread}
        onChange={(e) => setShowThread(e.target.checked)}
      />

      <label htmlFor="cord-show-header">show header:</label>
      <input
        id="cord-show-header"
        type="checkbox"
        checked={showHeader}
        onChange={(e) => setShowHeader(e.target.checked)}
      />

      <label htmlFor="cord-composer-expanded">composer expanded:</label>
      <input
        id="cord-composer-expanded"
        type="checkbox"
        checked={composerExpanded}
        onChange={(e) => setComposerExpanded(e.target.checked)}
      />

      <code>{unescapeXMLQuotes(code || '')}</code>

      <p style={{ gridColumn: '1 / -1' }}>
        Number of undeleted messages: {messageCount}
      </p>

      <p style={{ gridColumn: '1' }}>Add reaction to first message</p>
      {threadData?.thread?.firstMessage && (
        <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
          <Reactions
            threadId={threadID}
            messageId={threadData?.thread.firstMessage.id}
          />
          <betaV2.Reactions
            threadID={threadID}
            messageID={threadData?.thread.firstMessage.id}
            replace={{
              EmojiPicker: MyEmojiPicker,
            }}
          />
        </div>
      )}

      <p style={{ gridColumn: '1', margin: '0' }}>Timestamp</p>
      <Timestamp style={{ display: 'flex' }} />

      {showThread && (
        <>
          <Thread
            id={threadID}
            forwardRef={threadRef}
            location={location}
            threadId={threadID}
            threadName={threadName}
            metadata={metadata}
            collapsed={collapsed}
            showHeader={showHeader}
            composerExpanded={composerExpanded}
            onThreadInfoChange={onThreadInfoChange}
          />
        </>
      )}
    </div>
  );
}
