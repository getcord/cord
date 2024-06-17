import type * as React from 'react';
import { useCallback } from 'react';
import type { HTMLCordElement } from '@cord-sdk/types';
import type { CustomEventsDefinition } from './useCustomEventListener.js';
import { useCustomEventListeners } from './useCustomEventListener.js';
import { useForwardCustomElementRef } from './useForwardCustomElementRef.js';

export function useCustomElementRef<
  Events extends Record<string, unknown[]>,
  HTMLElementInterface extends HTMLCordElement,
>(
  events: CustomEventsDefinition<Events>,
  forwardedRef: React.ForwardedRef<HTMLElementInterface>,
) {
  const [updateCustomEventListeners, listenersAttached] =
    useCustomEventListeners(events);
  const updateForwardedRef = useForwardCustomElementRef(forwardedRef);

  return [
    useCallback(
      (e: HTMLElementInterface | null) => {
        updateForwardedRef(e);
        updateCustomEventListeners(e);
      },
      [updateCustomEventListeners, updateForwardedRef],
    ),
    listenersAttached,
  ] as const;
}
