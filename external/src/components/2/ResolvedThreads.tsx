import { useEffect, useMemo, useRef } from 'react';

import type { UUID } from 'common/types/index.ts';
import { Thread2 } from 'external/src/components/2/thread2/index.tsx';
import { ResolvedThreadHeader } from 'external/src/components/ui3/thread/ResolvedThreadHeader.tsx';

type Props = {
  onClickThread: () => void;
  threadID: UUID;
  scrollIntoViewOnMount?: boolean;
};

export function ResolvedThread2({
  threadID,
  onClickThread,
  scrollIntoViewOnMount,
}: Props) {
  const threadContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollIntoViewOnMount) {
      // Scroll so thread is positioned in middle of scroll container vertically
      threadContainerRef.current?.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      });
    }
  }, [scrollIntoViewOnMount]);

  const threadHeader = useMemo(
    () => <ResolvedThreadHeader threadID={threadID} />,
    [threadID],
  );

  return (
    <div
      onClick={onClickThread}
      style={{ cursor: 'pointer' }}
      ref={threadContainerRef}
    >
      <Thread2
        threadID={threadID}
        mode="collapsed"
        threadHeader={threadHeader}
        allowReplyFromCollapsed={false}
      />
    </div>
  );
}
