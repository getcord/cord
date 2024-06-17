import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { Location } from '@cord-sdk/types';
import { Slot } from '@radix-ui/react-slot';
import { useDocumentVisibility } from '../../common/effects/useDocumentVisibility.js';
import { useCordContext } from '../../contexts/CordContext.js';
import { useViewerData } from '../../hooks/user.js';
import { throttle } from '../../common/lib/throttle.js';
import type { PresenceObserverReactComponentProps } from '../../betaV2.js';

// Number of seconds that need to pass since a given page has lost
// focus before we stop considering it the page the user is actively
// on/looking at.
const PAGE_PRESENCE_LOSS_TTL_SECONDS = 30;
// Number of milliseconds between active presence pings to server.
const PRESENCE_UPDATE_INTERVAL_MS = (PAGE_PRESENCE_LOSS_TTL_SECONDS * 1000) / 2;
// The minimum period between durable presence updates
const DURABLE_PRESENCE_THROTTLE_MS = 60 * 1000; // 1 minute

export function PresenceObserver({
  location,
  observeDocument = false,
  durable = false,
  presentEvents = ['mouseenter', 'focusin'],
  absentEvents = ['mouseleave', 'focusout'],
  onChange,
  groupID: propsGroupID,
  children,
}: PresenceObserverReactComponentProps) {
  const [present, setPresent] = useState<boolean | undefined>(observeDocument);
  const { sdk } = useCordContext('PresenceObserver');
  const presenceSDK = sdk?.presence;
  const documentVisible = useDocumentVisibility();
  const viewer = useViewerData();
  const elementToObserveRef = useRef<HTMLElement>(null);

  const groupID = propsGroupID ?? viewer?.groupID;
  if (!groupID) {
    throw new Error('Must specify a groupID');
  }

  // Only error if the two groups don't match: do allow matching groups for the
  // purposes of migrations
  const mismatchingGroupID =
    viewer?.groupID && groupID && viewer?.groupID !== groupID;
  if (mismatchingGroupID) {
    throw new Error(
      'Must not specify a groupID on the component if the user is signed in with an access token that contains a groupID - choose one or the other',
    );
  }

  const lastValueRef = useRef<boolean>(false);
  useEffect(() => {
    let cleanupFn = undefined;
    const newValue = !!present && documentVisible;
    if (newValue) {
      const update = () => {
        if (presenceSDK) {
          void presenceSDK.setPresent(location, {
            groupID,
            ...getCordInternalFlags(),
          });
        }
      };
      update();
      const interval = setInterval(update, PRESENCE_UPDATE_INTERVAL_MS);
      cleanupFn = () => {
        clearInterval(interval);
        if (presenceSDK) {
          void presenceSDK.setPresent(location, {
            absent: true,
            groupID,
            ...getCordInternalFlags(),
          });
        }
      };
    }
    if (newValue !== lastValueRef.current) {
      onChange?.(newValue);
      lastValueRef.current = newValue;
    }
    return cleanupFn;
  }, [
    location,
    present,
    documentVisible,
    groupID,
    sdk?.presence,
    presenceSDK,
    onChange,
  ]);

  // We specifically want to call useCallback() on the function returned by
  // throttle(), and we want to reset it if the location changes, so that we keep
  // the same throttling timer for the same location but don't throttle the first
  // call to a new location.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledDurableUpdate = useCallback(
    throttle({ interval: DURABLE_PRESENCE_THROTTLE_MS }, (l: Location) => {
      if (presenceSDK) {
        void presenceSDK.setPresent(l, {
          durable: true,
          groupID,
          ...getCordInternalFlags(),
        });
      }
    }),
    [sdk, location],
  );
  useEffect(() => {
    if (present && durable) {
      throttledDurableUpdate(location);
      // When we leave the page or stop being present, make a final update so we
      // record their departure timestamp for future reference.
      return () => throttledDurableUpdate(location);
    }
    return undefined;
  }, [location, present, durable, throttledDurableUpdate]);

  useEffect(() => {
    if (!elementToObserveRef.current) {
      return;
    }

    const elementToObserve = elementToObserveRef.current;
    const setIsPresent = () => setPresent(true);

    for (const event of presentEvents) {
      elementToObserve.addEventListener(event.toLowerCase(), setIsPresent);
    }

    return () => {
      for (const event of presentEvents) {
        elementToObserve.removeEventListener(event.toLowerCase(), setIsPresent);
      }
    };
  }, [presentEvents]);

  useEffect(() => {
    if (!elementToObserveRef.current) {
      return;
    }

    const elementToObserve = elementToObserveRef.current;
    const setIsAbsent = () => setPresent(false);
    for (const event of absentEvents) {
      elementToObserve.addEventListener(event.toLowerCase(), setIsAbsent);
    }

    return () => {
      for (const event of absentEvents) {
        elementToObserve.removeEventListener(event.toLowerCase(), setIsAbsent);
      }
    };
  }, [absentEvents]);

  return (
    <Slot ref={observeDocument ? null : elementToObserveRef}>{children}</Slot>
  );
}

// A secret param passed to a few API functions which only affects Cord's
// logging. Feel free to remove this if you're modifying this code in your own
// app.
function getCordInternalFlags() {
  return { __cordInternal: true };
}
