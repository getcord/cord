import { useEffect, useMemo } from 'react';

import { MessageSeenObserverContext } from 'external/src/context/messageSeenObserver/MessageSeenObserverContext.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import {
  getUnseenReactions,
  isUserAuthorOfMessage,
} from 'external/src/lib/util.ts';
import type { MessageFragment } from 'external/src/graphql/operations.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';

export function useMessageSeenObserver2(
  message: MessageFragment,
  messageElementRef: React.RefObject<HTMLElement>,
) {
  const messageSeenObserverContext = useContextThrowingIfNoProvider(
    MessageSeenObserverContext,
  );
  const { threadID, threadMode, thread } =
    useContextThrowingIfNoProvider(Thread2Context);
  const { markThreadSeen, clearNotificationsForMessage } =
    useContextThrowingIfNoProvider(ThreadsContext2);

  const { user } = useContextThrowingIfNoProvider(IdentityContext);
  const isAuthorOfMessage = isUserAuthorOfMessage(message, user.externalID);
  const unseenReactions = useMemo(
    () => getUnseenReactions(thread, message, user.externalID),
    [message, thread, user],
  );

  useEffect(() => {
    if (threadMode === 'collapsed') {
      return;
    }

    messageSeenObserverContext.observeMessage(
      message.id,
      threadID,
      messageElementRef,
      () => {
        // message.seen actually checks whether the thread has been seen.
        // We currently have no way of tracking individual comments read status.
        if (!message.seen || unseenReactions.length > 0) {
          markThreadSeen(threadID);
        }
        clearNotificationsForMessage(message.id);
      },
    );
    return () => messageSeenObserverContext.unobserveMessage(message.id);
  }, [
    isAuthorOfMessage,
    markThreadSeen,
    clearNotificationsForMessage,
    message.id,
    message.seen,
    messageElementRef,
    messageSeenObserverContext,
    threadID,
    threadMode,
    unseenReactions,
  ]);
}
