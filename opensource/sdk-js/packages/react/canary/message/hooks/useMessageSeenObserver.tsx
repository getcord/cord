import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactDOM from 'react-dom';

import type { ClientMessageData, ThreadSummary } from '@cord-sdk/types';
import { user as userSDK, thread as threadSDK } from '@cord-sdk/react';

// Polling interval to check for any messages that have intersected for enough time
// to be considered visible
const CHECK_FOR_NEW_SEEN_MESSAGES_INTERVAL_MS = 1000;

// Minimum amount of seconds a message should be visible to be considered seen.
// "Minimum" because we are using a poll interval to check if a message is in view,
// so best case it's MESSAGE_SEEN_VISIBILITY_COUNT_THRESHOLD_MS, worst case is
// CHECK_FOR_NEW_SEEN_MESSAGES_INTERVAL_MS + MESSAGE_SEEN_VISIBILITY_COUNT_THRESHOLD_MS
const MESSAGE_SEEN_VISIBILITY_COUNT_THRESHOLD_MS = 1000;

// Min amount of element within container to be considered visible
const MESSAGE_VISIBLE_AMOUNT_THRESHOLD = 0.5;

// For a message taller than container, min amount of intersection to be
// considered visible. This is rare, as messages start truncated. It could
// happen if truncated message is expanded before it is registered as seen
const BIG_MESSAGE_VISIBLE_AMOUNT_THRESHOLD = 0.75;

type MessageSeenInfo = {
  messageID: string;
  threadID: string;
  localUpdateFn: () => void;
};

export function useMessageSeenObserver(message: ClientMessageData) {
  const messageElementRef = useRef(null);
  const threadID = message.threadID;
  const { thread } = threadSDK.useThread(threadID, { skip: !threadID });

  const userData = userSDK.useViewerData();
  const isAuthorOfMessage = isUserAuthorOfMessage(message, userData?.id);
  const unseenReactions = useMemo(
    () => getUnseenReactions(thread, message, userData?.id),
    [message, thread, userData?.id],
  );

  const currentlyIntersectingRef = useRef<
    Map<Element, IntersectionObserverEntry>
  >(new Map());

  const elementsToMessageIDs = useRef<Map<Element, string>>(new Map());
  const messageIDsToElements = useRef<Map<string, Element>>(new Map());
  const messageIDsToOnSeenFns = useRef<Map<string, () => void>>(new Map());
  const messageIDsToThreadIDs = useRef<Map<string, string>>(new Map());

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
      threshold: MESSAGE_VISIBLE_AMOUNT_THRESHOLD,
    });
  }, [onIntersection]);

  const unobserveElement = useCallback(
    (element: Element, messageID?: string) => {
      messageID = messageID ?? elementsToMessageIDs.current.get(element);
      intersectionObserverRef.current?.unobserve(element);
      elementsToMessageIDs.current.delete(element);
      currentlyIntersectingRef.current.delete(element);
      if (messageID) {
        messageIDsToElements.current.delete(messageID);
        messageIDsToOnSeenFns.current.delete(messageID);
        messageIDsToThreadIDs.current.delete(messageID);
      }
    },
    [],
  );

  // Update seen status of any messages that have been intersecting for minimum time
  useEffect(() => {
    if (!someMessagesIntersecting) {
      return;
    }
    const updater = setInterval(() => {
      const timestamp = performance.now();
      const newMessagesSeen: MessageSeenInfo[] = [];
      for (const [element, entry] of currentlyIntersectingRef.current) {
        if (
          timestamp - entry.time >
          MESSAGE_SEEN_VISIBILITY_COUNT_THRESHOLD_MS
        ) {
          const messageID = elementsToMessageIDs.current.get(element);
          if (messageID) {
            const currentThreadID =
              messageIDsToThreadIDs.current.get(messageID)!;
            const localUpdateFn = messageIDsToOnSeenFns.current.get(messageID)!;
            newMessagesSeen.push({
              messageID,
              threadID: currentThreadID,
              localUpdateFn,
            });
          } else {
            console.error('No messageID found for element', element);
          }
          unobserveElement(element, messageID);
        }
      }
      if (newMessagesSeen.length) {
        const messagesByThread = groupMessagesByThread(newMessagesSeen);
        for (const [_threadID, messages] of Object.entries(messagesByThread)) {
          batchReactUpdates(() => {
            for (const messageToUpdate of messages) {
              messageToUpdate.localUpdateFn();
            }
          });
        }
      }
    }, CHECK_FOR_NEW_SEEN_MESSAGES_INTERVAL_MS);
    return () => clearInterval(updater);
  }, [someMessagesIntersecting, unobserveElement]);

  const observeMessage = useCallback(
    (
      messageID: string,
      observedThreadID: string,
      observedMessageElementRef: React.RefObject<HTMLElement>,
      onSeenLocalUpdate: () => void,
    ) => {
      if (!messageElementRef.current) {
        return;
      }
      intersectionObserverRef.current!.observe(
        observedMessageElementRef.current!,
      );
      elementsToMessageIDs.current.set(
        observedMessageElementRef.current!,
        messageID,
      );
      messageIDsToElements.current.set(
        messageID,
        observedMessageElementRef.current!,
      );
      messageIDsToOnSeenFns.current.set(messageID, onSeenLocalUpdate);
      messageIDsToThreadIDs.current.set(messageID, observedThreadID);
    },
    [],
  );

  const unobserveMessage = useCallback(
    (messageID: string) => {
      const element = messageIDsToElements.current.get(messageID);
      if (element) {
        unobserveElement(element, messageID);
      }
    },
    [unobserveElement],
  );

  useEffect(() => {
    const intersectionObserver = intersectionObserverRef.current!;
    return () => intersectionObserver.disconnect();
  }, []);

  useEffect(() => {
    observeMessage(message.id, threadID, messageElementRef, () => {
      // message.seen actually checks whether the thread has been seen.
      // We currently have no way of tracking individual comments read status.
      if (!message.seen || unseenReactions.length > 0) {
        markThreadSeen(threadID);
      }
      clearNotificationsForMessage(message.id);
    });
    return () => unobserveMessage(message.id);
  }, [
    isAuthorOfMessage,
    message.id,
    message.seen,
    messageElementRef,
    threadID,
    unseenReactions,
    observeMessage,
    unobserveMessage,
  ]);

  return messageElementRef;
}

function isUserAuthorOfMessage(
  message: ClientMessageData,
  externalUserID: string | null | undefined,
) {
  return !externalUserID || externalUserID === message.authorID;
}

function getUnseenReactions(
  thread: ThreadSummary | undefined | null,
  message: ClientMessageData,
  userID: string | null | undefined,
) {
  if (!thread) {
    return [];
  }

  const threadParticipant = thread.participants.find(
    (p) => p.userID === userID,
  );

  return isUserAuthorOfMessage(message, userID)
    ? message.reactions.filter(
        (reaction) =>
          reaction.timestamp >
            (threadParticipant?.lastSeenTimestamp ?? Infinity) &&
          reaction.userID !== userID,
      )
    : [];
}

function clearNotificationsForMessage(messageID: string) {
  window.CordSDK &&
    void window.CordSDK.notification.markAllAsRead({ filter: { messageID } });
}

function markThreadSeen(seenThreadID: string) {
  window.CordSDK && void window.CordSDK.thread.setSeen(seenThreadID, true);
}

/**
Batching stops 20 dispatch calls causing 20 re-renders. It is unstable
in that you shouldn't rely on it, but use is recommended and it is
used in redux (https://github.com/reduxjs/react-redux/issues/1091,
https://twitter.com/dan_abramov/status/1103399900371447819)
*/
function batchReactUpdates(updateFn: () => void) {
  ReactDOM.unstable_batchedUpdates(updateFn);
}

function groupMessagesByThread(
  array: MessageSeenInfo[],
): Record<string, MessageSeenInfo[]> {
  return array.reduce(
    (acc, item) => {
      if (!acc[item.threadID]) {
        acc[item.threadID] = [];
      }
      acc[item.threadID].push(item);
      return acc;
    },
    {} as Record<string, MessageSeenInfo[]>,
  );
}
