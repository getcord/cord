import { useContext, useEffect, useState } from 'react';

import { betaV2, thread } from '@cord-sdk/react';
import { LIVE_COMPONENT_ON_DOCS_MESSAGE_THREAD_ID_PREFIX } from 'common/const/Ids.ts';

import { AuthContext } from 'docs/server/state/AuthProvider.tsx';
import { ReplacementCard } from 'docs/server/ui/replacementCard/replacementCard.tsx';

const components = [
  { name: 'MessageLayout', cordClass: 'cord-message' },
  { name: 'ReactionPickButton', cordClass: 'cord-add-reaction' },
  { name: 'Reactions', cordClass: 'cord-reactions-container' },
  { name: 'Avatar', cordClass: 'cord-avatar-container' },
  { name: 'Button', cordClass: 'cord-button' },
  { name: 'Timestamp', cordClass: 'cord-timestamp' },
];

export function Message() {
  const { organizationID } = useContext(AuthContext);

  const [threadID, setThreadID] = useState<string | undefined>(undefined);

  useEffect(() => {
    setThreadID(
      `${LIVE_COMPONENT_ON_DOCS_MESSAGE_THREAD_ID_PREFIX}${organizationID}`,
    );
  }, [organizationID, setThreadID]);

  const { thread: threadData } = thread.useThread(threadID, {
    skip: !threadID,
  });

  return (
    <ReplacementCard components={components}>
      {threadData && threadID && (
        <betaV2.Message message={threadData.firstMessage!} />
      )}
    </ReplacementCard>
  );
}
