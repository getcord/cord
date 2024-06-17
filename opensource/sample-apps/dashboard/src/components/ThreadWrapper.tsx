import cx from 'classnames';
import { Thread } from '@cord-sdk/react';
import type { FlatJsonObject } from '@cord-sdk/types';
import { useState, useEffect, useContext, useRef } from 'react';
import type { ThreadMetadata } from '../ThreadsContext';
import { ThreadsContext } from '../ThreadsContext';
import { SAMPLE_GROUP_ID } from './Dashboard';

type ThreadWrapperProps = {
  forwardRef?: React.RefObject<HTMLElement | null>;
  location: FlatJsonObject;
  threadId: string;
  metadata: ThreadMetadata;
  style?: React.CSSProperties;
};

// A wrapper over cord-thread that removes itself if empty when closed
export function ThreadWrapper({
  forwardRef,
  location,
  threadId,
  metadata,
  style,
}: ThreadWrapperProps) {
  const { openThread, removeThread, setOpenThread, allowAutofocus } =
    useContext(ThreadsContext)!;
  const numberOfMessages = useRef<number | undefined>(undefined);
  const [rendered, setRendered] = useState(false);

  // Effect that removes this thread if it has no messages at the time it is closed
  useEffect(() => {
    return () => {
      if (
        rendered &&
        (numberOfMessages.current === undefined ||
          numberOfMessages.current <= 0)
      ) {
        removeThread(threadId);
      }
    };
  }, [rendered, openThread, removeThread, threadId]);

  return (
    <Thread
      groupId={SAMPLE_GROUP_ID}
      forwardRef={forwardRef}
      location={location}
      threadId={threadId}
      metadata={metadata}
      autofocus={allowAutofocus && openThread === threadId}
      className={cx({ ['open-thread']: openThread === threadId })}
      style={{
        width: '300px',
        maxHeight: '400px',
        ...style,
      }}
      onThreadInfoChange={(info) => {
        numberOfMessages.current = info.messageCount;
      }}
      onRender={() => {
        setRendered(true);
      }}
      onClose={() => setOpenThread(null)}
    />
  );
}
