import { useEffect, useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import type { ComposerAttachment } from 'external/src/context/composer/ComposerState.ts';
import { Thread2Provider } from 'external/src/context/thread2/Thread2Provider.tsx';
import { ComposerProvider } from 'external/src/context/composer/ComposerProvider.tsx';
import { Composer3 } from 'external/src/components/2/Composer3.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ThreadsDataContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { THREAD_STYLE } from 'sdk/client/core/react/Thread.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { GlobalElementProvider } from 'external/src/context/globalElement/GlobalElementProvider.tsx';
import { PagePresenceAndVisitorsShim } from 'sdk/client/core/react/PagePresenceAndVisitorsShim.tsx';

type Props = {
  draftAnnotation?: ComposerAttachment;
  forwardRef?: React.RefObject<HTMLDivElement>;
  onComplete: (threadID: string) => void;
};

export function FloatingComposer({
  draftAnnotation,
  forwardRef,
  onComplete,
}: Props) {
  const threadID = useMemo(() => uuid(), []);

  const threadData = useContextThrowingIfNoProvider(ThreadsDataContext2);
  const thread = threadData[threadID];

  useEffect(() => {
    // once the thread is created, notify the parent component so it can go out of composer mode
    if (thread) {
      onComplete(threadID);
    }
  }, [thread, onComplete, threadID]);

  return (
    <div
      ref={forwardRef}
      style={{
        ...THREAD_STYLE,
        border: cssVar('thread-border'),
        boxShadow: cssVar('shadow-large'),
        borderRadius: cssVar('thread-border-radius'),
        position: 'relative',
        width: 300,
      }}
    >
      <GlobalElementProvider>
        <PagePresenceAndVisitorsShim>
          <Thread2Provider
            threadID={threadID}
            initialSlackShareChannel={null}
            threadMode={'newThread'}
          >
            <ComposerProvider initialComposerAttachment={draftAnnotation}>
              <Composer3 shouldFocusOnMount={true} />
            </ComposerProvider>
          </Thread2Provider>
        </PagePresenceAndVisitorsShim>
      </GlobalElementProvider>
    </div>
  );
}
