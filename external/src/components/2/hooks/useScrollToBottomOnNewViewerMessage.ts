import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import type { ThreadData } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import type { UUID } from 'common/types/index.ts';
import type { MessageFragment } from 'external/src/graphql/operations.ts';

/**
 * Scrolls the given scroll container to the bottom when the current user writes
 * a new message in the thread.
 */
export function useScrollToBottomOnNewViewerMessage(
  scrollContainerRef: RefObject<HTMLDivElement>,
  thread: ThreadData,
) {
  const { user } = useContextThrowingIfNoProvider(IdentityContext);

  // Scroll to the end when the user sends a new message.  We detect this by
  // seeing when the ID of the last message changes, then checking if the new
  // last message is by the author.

  // Array accesses are assumed by TS to always work, but we might get undefined
  // back if the array is empty, hence the type cast.
  const lastMessage = thread.messages[thread.messages.length - 1] as
    | MessageFragment
    | undefined;
  const previousLastMessageIdRef = useRef<UUID | undefined>(lastMessage?.id);

  useEffect(() => {
    if (
      scrollContainerRef.current &&
      lastMessage?.id !== previousLastMessageIdRef.current &&
      lastMessage?.source.id === user.id
    ) {
      const scrollContainer = scrollContainerRef.current;
      // Use a setTimeout because at this point we haven't rendered the
      // message yet, so we want to scroll after the message has been added to
      // the thread.
      setTimeout(
        () =>
          scrollContainer.scroll({
            top: scrollContainer.scrollHeight,
            // For some reason, the ScrollBehavior type doesn't include
            // 'instant', which is valid value per
            // https://developer.mozilla.org/en-US/docs/Web/API/Element/scroll
            behavior: 'instant' as ScrollBehavior,
          }),
        0,
      );
    }
    previousLastMessageIdRef.current = lastMessage?.id;
  }, [scrollContainerRef, lastMessage, user.id]);
}
