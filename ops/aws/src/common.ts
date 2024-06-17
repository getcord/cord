// This module exports the all important `define` function. See
// `ops/aws/README.md` for information how to use it.

// This is a simple memoization helper. It takes a function (which takes no
// arguments and returns some type `T`) and returns a new function (which also
// takes no arguments and returns the same type `T`).  If you call the returned
// function, it will call the function that you passed in and return its return
// value. If you call the same returned function then a second time, it will
// return the saved result of the wrapped function's first invocation.
//
// I.e. the function that you pass into memoize will get executed at most once,
// no matter how often you call the returned function.
//
// Let's assume you did the following: `mfunc = memoize(func)`. So the first
// call to `mfunc` will make a call to `func`, whereas any further calls to
// `mfunc` won't. All calls to `mfunc` return what the initial call to `func`
// returned.  In the unfortunate circumstance that `func`, when it finally gets
// called, for some reason call `mfunc`, an exception is thrown. Apparently the
// execution of `func` somehow depends on its own result, which would be a
// cyclic dependency.

function memoize<T>(func: () => T): () => T {
  let ready = false;
  let calling = false;
  let result: T | undefined = undefined;

  return () => {
    if (!ready) {
      if (calling) {
        throw new Error('Cyclic dependency');
      }
      calling = true;
      result = func();
      calling = false;
      ready = true;
    }
    return result as T;
  };
}

// The `define` function is essentially the `memoize` function from above, but
// it collects all the wrapped functions in the global array
// `allDefinitions`.

const allDefinitions: Array<() => any> = [];

export function define<T>(func: () => T): () => T {
  const m = memoize(func);
  allDefinitions.push(m);
  return m;
}

type TierMap<T> = { [k in Tier]: () => T };

export function defineForEachTier<T>(func: (t: Tier) => T): TierMap<T> {
  const results: any = {};
  for (const tier of tiers) {
    results[tier] = define(() => func(tier));
  }
  return results as TierMap<T>;
}

// `invokeAllDefinitions` then just calls all those functions that `define`
// returned.  (It returns an array containing all the returned values.) Calling
// `invokeAllDefinitions` guarantees that all those functions that were passed
// to `define` are executed exactly once. Thanks to `memoize` they will never
// be executed more than once, and now that we make a call to all the
// memoize-wrapped functions, we make sure that each of them does get called.

export function invokeAllDefinitions() {
  return Promise.all(allDefinitions.map((m) => m()));
}

export const tiers = ['prod', 'staging', 'loadtest'] as const;

export type Tier = (typeof tiers)[number];
