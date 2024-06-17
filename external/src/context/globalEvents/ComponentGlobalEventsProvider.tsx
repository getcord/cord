import { useCallback, useMemo, useRef } from 'react';
import type {
  GlobalEventType,
  GlobalEventsContextType,
} from 'external/src/context/globalEvents/GlobalEventsContext.tsx';
import { GlobalEventsContext } from 'external/src/context/globalEvents/GlobalEventsContext.tsx';
import type { MessageListener } from 'external/src/lib/xframe/types.ts';
import { useSlackConnectEvents } from 'external/src/effects/useSlackConnectEvents.ts';

export function ComponentGlobalEventsProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  const listenersRef = useRef(
    new Map<GlobalEventType, Set<MessageListener<any>>>(),
  );

  const addGlobalEventListener = useCallback<
    GlobalEventsContextType['addGlobalEventListener']
  >((type, listener) => {
    const listeners = listenersRef.current.get(type);
    if (listeners) {
      listeners.add(listener);
    } else {
      listenersRef.current.set(type, new Set([listener]));
    }

    return () => {
      listenersRef.current.get(type)?.delete(listener);
    };
  }, []);

  const removeGlobalEventListener = useCallback<
    GlobalEventsContextType['removeGlobalEventListener']
  >((type, listener) => {
    listenersRef.current.get(type)?.delete(listener);
  }, []);

  const triggerGlobalEvent = useCallback<
    GlobalEventsContextType['triggerGlobalEvent']
  >(
    (_targetWindow, type, ...data) =>
      new Promise((resolve) => {
        /*
          I'm not sure why this setTimeout(0) is needed but something weird is going on
          when you try to maximise an annotation screenshot. This setTimeout recreates
          the previous message-based behaviour which had a tick of waiting due to the 
          postMessage/listener mechanism.
        */
        setTimeout(() => {
          const listeners = [...(listenersRef.current.get(type) ?? [])];
          let result: unknown;
          for (const listener of listeners) {
            // the [0] here is messy but needed to match the structure of sendXFrameMessage
            result = listener({ data: data?.[0] });
          }

          if (result instanceof Promise) {
            void result.then(resolve);
          } else {
            resolve(result);
          }
        }, 0);
      }),
    [],
  );

  const slackEvents = useSlackConnectEvents();

  const contextValue = useMemo(
    () => ({
      addGlobalEventListener,
      removeGlobalEventListener,
      triggerGlobalEvent,
      slackEvents,
    }),
    [
      addGlobalEventListener,
      removeGlobalEventListener,
      slackEvents,
      triggerGlobalEvent,
    ],
  );

  return (
    <GlobalEventsContext.Provider value={contextValue}>
      {children}
    </GlobalEventsContext.Provider>
  );
}
