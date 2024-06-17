import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { group } from 'radash';

import { MessageSeenObserverContext } from 'external/src/context/messageSeenObserver/MessageSeenObserverContext.ts';
import type { UUID } from 'common/types/index.ts';
import { batchReactUpdates, doNothing } from 'external/src/lib/util.ts';

// Polling interval to check for any messages that have intersected for enough time
// to be considered visible
const CHECK_FOR_NEW_SEEN_MESSAGES_INTERVAL_MS = 1000;

// Minimum amount of seconds a message should be visible to be considered seen.
// "Minimum" because we are using a poll internval to check if a message is in view,
// so best case it's MESSAGE_SEEN_VISIBILITY_COUNT_THRESHOLD_MS, worst case is
// CHECK_FOR_NEW_SEEN_MESSAGES_INTERVAL_MS + MESSAGE_SEEN_VISIBILITY_COUNT_THRESHOLD_MS
const MESSAGE_SEEN_VISIBILITY_COUNT_THRESHOLD_MS = 1000;

// Min amount of element within container to be considered visible
const MESSAGE_VISIBLE_AMOUNT_THRESHOLD = 0.5;

// For a message taller than container, min amount of intersection to be
// considered visible. This is rare, as messages start truncated. It could
// happen if truncated message is expanded before it is registered as seen
const BIG_MESSAGE_VISIBLE_AMOUNT_THRESHOLD = 0.75;

type Props = {
  containerRef: React.RefObject<HTMLElement>;
  disabled?: boolean;
};

// How this works
// - IntersectionObserver runs when message elements intersect with the container
// - If the element is visible enough to consider seen, we add it to currently
//   intersecting. If it is not, we remove it from intersecting if present
// - If 1 or more elements are currently intersecting, we check every second for
//   any that have met the minimum time requirement
// - As elements meet the time requirement, we update the DB and unobserve them
export const MessageSeenObserverProvider = ({
  containerRef,
  children,
  disabled = false,
}: React.PropsWithChildren<Props>) => {
  // Keep track of elements that are visible, but haven't yet been visible for
  // long enough to be marked as seen
  const currentlyIntersectingRef = useRef<
    Map<Element, IntersectionObserverEntry>
  >(new Map());

  const elementsToMessageIDs = useRef<Map<Element, UUID>>(new Map());
  const messageIDsToElements = useRef<Map<UUID, Element>>(new Map());
  const messageIDsToOnSeenFns = useRef<Map<UUID, () => void>>(new Map());
  const messageIDsToThreadIDs = useRef<Map<UUID, UUID>>(new Map());

  // We don't want to run interval to check for seen messages if none are intersecting
  const [someMessagesIntersecting, setSomeMessagesIntersecting] =
    useState(false);

  const onIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      const wasIntersecting = currentlyIntersectingRef.current.has(
        entry.target,
      );

      const isIntersecting =
        entry.isIntersecting ||
        (entry.rootBounds &&
          entry.intersectionRect.height >
            BIG_MESSAGE_VISIBLE_AMOUNT_THRESHOLD * entry.rootBounds.height);

      if (!wasIntersecting && isIntersecting) {
        currentlyIntersectingRef.current.set(entry.target, entry);
      } else if (wasIntersecting && !isIntersecting) {
        currentlyIntersectingRef.current.delete(entry.target);
      }
    }
    setSomeMessagesIntersecting(currentlyIntersectingRef.current.size > 0);
  }, []);

  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  useLayoutEffect(() => {
    intersectionObserverRef.current = new IntersectionObserver(onIntersection, {
      root: containerRef.current!,
      threshold: MESSAGE_VISIBLE_AMOUNT_THRESHOLD,
    });
  }, [containerRef, onIntersection]);

  const unobserveElement = useCallback((element: Element, messageID?: UUID) => {
    messageID = messageID ?? elementsToMessageIDs.current.get(element);
    intersectionObserverRef.current?.unobserve(element);
    elementsToMessageIDs.current.delete(element);
    currentlyIntersectingRef.current.delete(element);
    if (messageID) {
      messageIDsToElements.current.delete(messageID);
      messageIDsToOnSeenFns.current.delete(messageID);
      messageIDsToThreadIDs.current.delete(messageID);
    }
  }, []);

  // Update seen status of any messages that have been intersecting for minimum time
  useEffect(() => {
    if (!someMessagesIntersecting) {
      return;
    }
    const updater = setInterval(() => {
      const timestamp = performance.now();
      const newMessagesSeen: Array<{
        messageID: UUID;
        threadID: UUID;
        localUpdateFn: () => void;
      }> = [];
      for (const [element, entry] of currentlyIntersectingRef.current) {
        if (
          timestamp - entry.time >
          MESSAGE_SEEN_VISIBILITY_COUNT_THRESHOLD_MS
        ) {
          const messageID = elementsToMessageIDs.current.get(element);
          if (messageID) {
            const threadID = messageIDsToThreadIDs.current.get(messageID)!;
            const localUpdateFn = messageIDsToOnSeenFns.current.get(messageID)!;
            newMessagesSeen.push({ messageID, threadID, localUpdateFn });
          } else {
            console.error('No messageID found for element', element);
          }
          unobserveElement(element, messageID);
        }
      }
      if (newMessagesSeen.length) {
        const messagesByThread = group(newMessagesSeen, (m) => m.threadID);
        for (const [_threadID, messages] of Object.entries(messagesByThread)) {
          batchReactUpdates(() => {
            for (const message of messages!) {
              message.localUpdateFn();
            }
          });
        }
      }
    }, CHECK_FOR_NEW_SEEN_MESSAGES_INTERVAL_MS);
    return () => clearInterval(updater);
  }, [someMessagesIntersecting, unobserveElement]);

  const observeMessage = useCallback(
    (
      messageID: UUID,
      threadID: UUID,
      messageElementRef: React.RefObject<HTMLElement>,
      onSeenLocalUpdate: () => void,
    ) => {
      intersectionObserverRef.current!.observe(messageElementRef.current!);
      elementsToMessageIDs.current.set(messageElementRef.current!, messageID);
      messageIDsToElements.current.set(messageID, messageElementRef.current!);
      messageIDsToOnSeenFns.current.set(messageID, onSeenLocalUpdate);
      messageIDsToThreadIDs.current.set(messageID, threadID);
    },
    [],
  );

  const unobserveMessage = useCallback(
    (messageID: UUID) => {
      const element = messageIDsToElements.current.get(messageID);
      if (element) {
        unobserveElement(element, messageID);
      }
    },
    [unobserveElement],
  );

  const contextValue = useMemo(
    () =>
      disabled
        ? DO_NOT_EXPORT_defaultMessageSeenObserver
        : {
            observeMessage,
            unobserveMessage,
          },
    [observeMessage, unobserveMessage, disabled],
  );

  useEffect(() => {
    const intersectionObserver = intersectionObserverRef.current!;
    return () => intersectionObserver.disconnect();
  }, []);

  return (
    <MessageSeenObserverContext.Provider value={contextValue}>
      {children}
    </MessageSeenObserverContext.Provider>
  );
};

const DO_NOT_EXPORT_defaultMessageSeenObserver = {
  observeMessage: doNothing,
  unobserveMessage: doNothing,
};
