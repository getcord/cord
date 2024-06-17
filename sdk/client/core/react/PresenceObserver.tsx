import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { throttle } from 'radash';

import type { PresenceObserverReactComponentProps } from '@cord-sdk/react';
import { withGroupIDCheck } from '@cord-sdk/react/common/hoc/withGroupIDCheck.tsx';

import { useCordLocation } from 'sdk/client/core/react/useCordLocation.tsx';
import {
  DURABLE_PRESENCE_THROTTLE_MS,
  PRESENCE_UPDATE_INTERVAL_MS,
} from 'common/const/Timing.ts';
import type { Location } from 'common/types/index.ts';
import { useDocumentVisibility } from 'external/src/effects/useDocumentVisibility.ts';
import { CordSDK } from 'sdk/client/core/index.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';

type InternalPresenceObserverProps = PresenceObserverReactComponentProps & {
  element?: Element;
};

const PresenceObserver = withGroupIDCheck<InternalPresenceObserverProps>(
  PresenceObserverImpl,
  'PresenceObserver',
);

function PresenceObserverImpl({
  context,
  location,
  element,
  durable = false,
  presentEvents = ['mouseenter', 'focusin'],
  absentEvents = ['mouseleave', 'focusout'],
  initialState,
  onChange,
  groupId: groupIDInput,
  observeDocument: _observeDocument, // Handled by webcomponent.
  children: _children, // Handled by webcomponent.
  ...rest
}: InternalPresenceObserverProps) {
  const _: Record<string, never> = rest;

  const [present, setPresent] = useState<boolean | undefined>(undefined);
  const cordLocation = useCordLocation(location ?? context);
  const { organization: tokenOrg } =
    useContextThrowingIfNoProvider(OrganizationContext);
  const sdk = CordSDK.get();
  const documentVisible = useDocumentVisibility();

  const groupID = groupIDInput ?? tokenOrg?.externalID;

  const lastValueRef = useRef<boolean>(false);
  useEffect(() => {
    let retval = undefined;
    const newValue = !!present && documentVisible;
    if (newValue) {
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      const location = cordLocation;
      const update = () => {
        void sdk.presence.setPresent(location, {
          groupID,
          __cordInternal: true,
        });
      };
      update();
      const interval = setInterval(update, PRESENCE_UPDATE_INTERVAL_MS);
      retval = () => {
        clearInterval(interval);
        void sdk.presence.setPresent(cordLocation, {
          absent: true,
          groupID,
          __cordInternal: true,
        });
      };
    }
    if (newValue !== lastValueRef.current) {
      onChange?.(newValue);
      lastValueRef.current = newValue;
    }
    return retval;
  }, [cordLocation, present, documentVisible, onChange, groupID, sdk.presence]);

  useEffect(() => {
    // If we aren't observing an element, we don't attach event listeners, so
    // make the presence true
    const initialStateValue = element === undefined || initialState;
    // Only update the presence state from the initial state if we haven't seen
    // an event yet; otherwise, we don't care about the desired initial state
    if (initialStateValue !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      setPresent((present) => present ?? initialStateValue);
    }
  }, [element, initialState]);

  // We specifically want to call useCallback() on the function returned by
  // throttle(), and we want to reset it if the location changes, so that we keep
  // the same throttling timer for the same location but don't throttle the first
  // call to a new location, but eslint can't find deps through a higher-order
  // function call.

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledDurableUpdate = useCallback(
    throttle(
      { interval: DURABLE_PRESENCE_THROTTLE_MS },
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      (location: Location) => {
        void sdk.presence.setPresent(location, {
          durable: true,
          groupID,
          __cordInternal: true,
        });
      },
    ),
    [sdk, cordLocation],
  );
  useEffect(() => {
    if (present && durable) {
      throttledDurableUpdate(cordLocation);
      // When we leave the page or stop being present, make a final update so we
      // record their departure timestamp for future reference.
      return () => throttledDurableUpdate(cordLocation);
    }
    return undefined;
  }, [cordLocation, present, durable, throttledDurableUpdate]);

  useEffect(() => {
    const setIsPresent = () => setPresent(true);

    for (const event of presentEvents) {
      element?.addEventListener(event.toLowerCase(), setIsPresent);
    }

    return () => {
      for (const event of presentEvents) {
        element?.removeEventListener(event.toLowerCase(), setIsPresent);
      }
    };
  }, [element, presentEvents]);

  useEffect(() => {
    const setIsAbsent = () => setPresent(false);

    for (const event of absentEvents) {
      element?.addEventListener(event.toLowerCase(), setIsAbsent);
    }

    return () => {
      for (const event of absentEvents) {
        element?.removeEventListener(event.toLowerCase(), setIsAbsent);
      }
    };
  }, [element, absentEvents]);

  return null;
}

// TODO: make this automatic
export default memo(PresenceObserver);
