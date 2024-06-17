import { useState, useEffect } from 'react';

export type CustomEventsDefinition<T extends Record<string, unknown[]>> = {
  [P in keyof T]: ((...args: T[P]) => unknown) | undefined;
};

export function useCustomEventListeners<T extends Record<string, unknown[]>>(
  events: CustomEventsDefinition<T>,
  // By default, a cord component will listen to events prefixed with `cord-<component>`.
  // However, we sometimes want to listen to events fired by other components.
  // An example of this is the `Thread` component listening for `cord-composer:focus` events.
  sourceComponentName?: string,
) {
  const [element, setElement] = useState<Element | null>(null);
  const [listenersAttached, setListenersAttached] = useState(false);

  useEffect(() => {
    if (!element) {
      return;
    }

    const handlers = Object.keys(events).map((event) => {
      const callback = events[event];
      const customEventHandler = (e: Event) => {
        if (e instanceof CustomEvent) {
          callback?.(...e.detail);
        }
      };

      const eventName = `${
        sourceComponentName ?? element.nodeName.toLowerCase()
      }:${event}`;
      element.addEventListener(eventName, customEventHandler);

      return [eventName, customEventHandler] as const;
    });
    setListenersAttached(true);

    return () => {
      for (const [eventName, handler] of handlers) {
        element.removeEventListener(eventName, handler);
      }
      setListenersAttached(false);
    };
  }, [element, events, sourceComponentName]);

  return [setElement, listenersAttached] as const;
}
