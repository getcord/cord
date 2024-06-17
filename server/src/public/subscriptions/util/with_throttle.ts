// Adapted from https://github.com/apollographql/graphql-subscriptions/blob/master/src/with-filter.ts

import { $$asyncIterator } from 'iterall';
import type { ResolverFn } from 'server/src/public/subscriptions/util/common.ts';

interface IterallAsyncIterator<T> extends AsyncIterator<T> {
  [$$asyncIterator](): IterallAsyncIterator<T>;
}

type ResolveFn<T> = (value: T) => void;
type RejectFn = (reason?: any) => void;

type MapKey = string | number | boolean | symbol;

/**
 * Given a function that returns an async iterator, produces a function that
 * returns an async iterator that only will produce a result every throttleMs
 * milliseconds.  The first and last events are always delivered, as well as any
 * event that has payload.done.
 *
 * This should only be used with subscriptions where it's safe to drop some
 * events if a later event arrives.
 */
export function withThrottle<T>(
  asyncIteratorFn: ResolverFn<T>,
  throttleMs: number,
  keyFunction: (t: T) => MapKey = () => '',
): ResolverFn<T> {
  return (
    rootValue: T,
    args: any,
    context: any,
    info: any,
  ): IterallAsyncIterator<any> => {
    const asyncIterator = asyncIteratorFn(rootValue, args, context, info);
    // This is a relatively straightforward state machine except for the
    // complication of delivering a cached value while we're waiting for another
    // value from the source.
    //
    // For each key, the normal mode of operation has three states:
    //
    // State 1: timers.has(key) === false, storedResults.has(key) === false: We
    // aren't currently throttling anything, so if an event comes in, deliver it
    // and transition to state 2.
    //
    // State 2: timers.has(key) === true, storedResults.has(key) === false: We
    // have started throttling but haven't suppressed any events.  If an event
    // arrives, store it and transition to state 3.  If the timer expires,
    // transition to state 1.
    //
    // State 3: timers.has(key) === true, storedResults.has(key) === true: We
    // have started throttling and have suppressed at least one event.  If an
    // event arrives, replace the stored event but otherwise do nothing.  If the
    // timer expires, deliver the cached event and transition to state 1.
    //
    // The complication is that when we deliver a cached event from state 3, we
    // will still be waiting for a new event to come from the source.  If that
    // arrives before anyone asks for it, we don't have a downstream promise to
    // resolve with it, so we need to stash it in storedPromises.
    const timers = new Map<MapKey, NodeJS.Timeout>();
    const storedResults = new Map<MapKey, IteratorResult<T>>();
    const storedPromises: Promise<IteratorResult<T>>[] = [];
    let nextResolve: ResolveFn<IteratorResult<T>> | undefined = undefined;
    let nextReject: RejectFn | undefined = undefined;

    function doResolve(result: IteratorResult<T>) {
      if (nextResolve) {
        const toCall = nextResolve;
        nextResolve = undefined;
        nextReject = undefined;
        toCall(result);
      } else {
        storedPromises.push(Promise.resolve(result));
      }
    }

    function doReject(reason?: any) {
      if (nextReject) {
        const toCall = nextReject;
        nextResolve = undefined;
        nextReject = undefined;
        toCall(reason);
      } else {
        storedPromises.push(Promise.reject(reason));
      }
    }

    return {
      next() {
        if (storedPromises.length > 0) {
          // Handle the case where we received a value when nobody was waiting
          // for it
          return storedPromises.shift()!;
        }
        return new Promise<IteratorResult<T>>((resolve, reject) => {
          nextResolve = resolve;
          nextReject = reject;
          const waitForIncomingPromise = () => {
            asyncIterator
              .next()
              .then((payload) => {
                if (payload.done === true) {
                  // We always immediately deliver done payloads.  If we have a
                  // stashed result, immediately deliver that first (no need to
                  // throttle, we're never getting another update), then deliver
                  // the done payload.
                  for (const timer of timers.values()) {
                    clearTimeout(timer);
                  }
                  timers.clear();
                  for (const storedResult of storedResults.values()) {
                    doResolve(storedResult);
                  }
                  storedResults.clear();
                  doResolve(payload);
                  return;
                }
                const key = keyFunction(payload.value);

                if (!timers.has(key)) {
                  const timerFn = () => {
                    const storedResult = storedResults.get(key);
                    if (storedResult) {
                      storedResults.delete(key);
                      timers.set(key, setTimeout(timerFn, throttleMs));
                      doResolve(storedResult);
                    } else {
                      timers.delete(key);
                    }
                  };
                  timers.set(key, setTimeout(timerFn, throttleMs));
                  doResolve(payload);
                  return;
                }

                storedResults.set(key, payload);
                waitForIncomingPromise();
              })
              .catch((err) => {
                doReject(err);
                return;
              });
          };

          waitForIncomingPromise();
        });
      },
      return() {
        return asyncIterator.return!();
      },
      throw(error) {
        return asyncIterator.throw!(error);
      },
      [$$asyncIterator]() {
        return this;
      },
    };
  };
}
