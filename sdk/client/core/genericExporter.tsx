import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ListenerRef } from '@cord-sdk/types';

type GenericExporter<T> = {
  observe: (state: T) => ListenerRef;
  unobserve: (ref: ListenerRef) => boolean;
  Element: () => JSX.Element;
};

/**
 * The idea of this functionality is to help expose data from our internal React
 * tree into our JavaScript API. Take, for example, thread data. It's all
 * wrapped up in some React contexts, and this helps us expose that.
 *
 * Customers who want access to some data will call an observe function,
 * typically providng information about what they want to observe (e.g., a
 * thread ID) and a callback called with the initial result as well as with all
 * updates. We'd like to implement the necessary data fetch using React hooks.
 * If you provide a JSX element to this function, it will spit back out the
 * observe/unobserve functions, as well as a JSX element which needs to be
 * inserted high into our React tree (but inside any necessary contexts). The
 * element you provided will be rendered once for each call to observe (that
 * hasn't been unobserved) -- the idea is that it will do the necessary React
 * hook usage and then call the callback which was (presumably) sent to observe.
 *
 * Honestly this is a bit difficult to explain in words -- take a look at
 * ThreadSDK and how it exports thread summaries for a useful example.
 *
 * Note that these shenanigans are only necessary if we want to expose data wich
 * is locked up in our React tree. If we, for example, just want to spit back
 * out the result of a GraphQL query + live updates, none of this is needed,
 * just directly call Apollo's JS API.
 */
export function makeGenericExporter<T>(
  Reporter: (props: { state: T }) => JSX.Element | null,
): GenericExporter<T> {
  let nextKey: ListenerRef = 0;
  type StateAndKey = { state: T; key: ListenerRef };
  const listeners = new Map<ListenerRef, StateAndKey>();
  let updateReactListeners:
    | ((listeners: StateAndKey[]) => unknown)
    | undefined = undefined;

  function doUpdateReactListeners() {
    updateReactListeners?.([...listeners.values()]);
  }

  function observe(state: T): ListenerRef {
    const key = nextKey++;
    listeners.set(key, { state, key });
    doUpdateReactListeners();
    return key;
  }

  function unobserve(ref: ListenerRef): boolean {
    if (listeners.has(ref)) {
      listeners.delete(ref);
      doUpdateReactListeners();
      return true;
    } else {
      return false;
    }
  }

  function Exporter(): JSX.Element {
    const [reactListeners, setReactListeners] = useState<StateAndKey[]>([]);

    useEffect(() => {
      if (updateReactListeners !== undefined) {
        throw new Error(
          'The element returned from makeGenericExporter should only be rendered once',
        );
      }

      updateReactListeners = setReactListeners;
      doUpdateReactListeners();
      return () => (updateReactListeners = undefined);
    }, []);

    return (
      <>
        {reactListeners.map((listener) => (
          <Reporter key={listener.key} state={listener.state} />
        ))}
      </>
    );
  }

  return {
    observe,
    unobserve,
    Element: Exporter,
  };
}

type SingletonExporter<T> = {
  get: () => Promise<T>;
  Element: () => ReactNode;
};

/**
 * A variation of the "generic exporter" pattern (see above) for cases where you
 * do not need multiple observers, but rather need to export fixed functions out
 * of a React context (e.g., mutation functions).
 *
 * Takes a React hook which returns the data you want to export from React into
 * vanilla JS. (This will probably pull something out of a React context, for
 * example.) Returns an element that you need to make sure ends up in the React
 * tree, and an async function which you can await from vanilla JS to get at the
 * data returned by the hook.
 *
 * As with the "generic exporter" above, this is a bit difficult to explain in
 * words -- take a look at ThreadSDK and how it deals with optimistically
 * marking a thread as seen for a useful example.
 *
 * Note that these shenanigans are only necessary if we want to call a function
 * which is locked up in our React tree. If we, for example, just want to call a
 * GraphQL mutation, none of this is needed, just directly call Apollo's JS API.
 */
export function makeSingletonExporter<T>(
  useGet: () => T,
): SingletonExporter<T> {
  const waiters: Array<() => void> = [];
  let data: T | undefined = undefined;

  async function get(): Promise<T> {
    // This can technically be an `if` instead of a `while`, but there's no good
    // way to explain to TS that we can never go from defined -> undefined, so
    // just write it this way.
    while (data === undefined) {
      await new Promise<void>((resolve, _reject) => {
        waiters.push(resolve);
      });
    }

    return data;
  }

  function Element(): ReactNode {
    data = useGet();

    let resolve;
    while ((resolve = waiters.pop())) {
      resolve();
    }

    return null;
  }

  return { get, Element };
}
