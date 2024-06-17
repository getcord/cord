import { useEffect, useState } from 'react';
import type { ICordSDK, ListenerRef } from '@cord-sdk/types';
import { useCordContext } from '../contexts/CordContext.js';
import { useMemoObject } from './useMemoObject.js';

export const NO_SELECTOR = Symbol('NO_SELECTOR');
export type NoSelectorType = typeof NO_SELECTOR;

export type SkipOption = {
  /**
   * When set to true, prevents the execution of any operations within the hook.
   */
  skip?: boolean;
};

// useObserveFunction relies heavily on the fact that our observeFoo functions
// all have one of four possible layouts:
//
// * observeFoo(callback)
// * observeFoo(callback, options)
// * observeFoo(id_or_location, callback)
// * observeFoo(id_or_location, callback, options)
//
// Since functions can be called with extra arguments in JS, we can ignore the
// optionality of options and collapse that down to two:
//
// * observeFoo(callback, options)
// * observeFoo(id_or_location, callback, options)
//
// We call the id_or_location argument the "selector".  The types below take
// such an observe function and return the type of the selector (or the type of
// the NO_SELECTOR symbol above), the options, and the value that the callback
// gets called with.

type ObserveFunc = (...args: any) => ListenerRef;
type CallbackFunc = (val: any) => unknown;
type UnobserveFunc = (ref: ListenerRef) => void;

// This resolves to the type of the selector in the observe function or typeof
// NO_SELECTOR if the function doesn't take a selector
type SelectorType<F extends ObserveFunc> = Parameters<F>[0] extends CallbackFunc
  ? NoSelectorType
  : Parameters<F>[0];

// This resolves to the type of the options object in the observe function or
// undefined if it doesn't have an options object
type OptionsType<F extends ObserveFunc> = Parameters<F>[0] extends CallbackFunc
  ? Parameters<F>[1]
  : Parameters<F>[2];

// This resolves to the type of the result value that the callback function will
// be given when it's called (and thus what type useObserveFunction returns)
type ValueType<F extends ObserveFunc> = Parameters<F>[0] extends CallbackFunc
  ? Parameters<Parameters<F>[0]>[0]
  : Parameters<Parameters<F>[1]>[0];

export function useObserveFunction<
  M extends 'user' | 'thread' | 'presence' | 'notification',
  F extends keyof ICordSDK[M] & `observe${string}`,
  Func extends ObserveFunc & ICordSDK[M][F],
  LoadingType,
>(
  module: M,
  observeName: F,
  selector: SelectorType<Func>,
  options: (OptionsType<Func> & SkipOption) | undefined,
  loadingValue: LoadingType,
  skipValue: LoadingType = loadingValue,
): ValueType<Func> | LoadingType {
  const { sdk } = useCordContext(`${module}.${observeName}`);
  const moduleObject = sdk?.[module];
  // The latest value that we've been given from the callback
  const [value, setValue] = useState<ValueType<Func>>();
  // The inputs that were used to get the above value.  We track this to avoid
  // returning stale values if the inputs change.
  const [valueFor, setValueFor] =
    useState<
      [SelectorType<Func>, (OptionsType<Func> & SkipOption) | undefined]
    >();

  const selectorMemo = useMemoObject(selector);
  const optionsMemo = useMemoObject(options);

  useEffect(() => {
    if (!moduleObject || optionsMemo?.skip) {
      return;
    }
    const observeFunc = (moduleObject[observeName] as Func).bind(moduleObject);
    // This is kind of horrible, but every observe function is paired with an
    // unobserve function and this keeps us from making every caller pass in
    // the name of the unobserve one.
    const unobserveFunc = (
      moduleObject[('un' + observeName) as keyof ICordSDK[M]] as UnobserveFunc
    ).bind(moduleObject);
    const callback = (newValue: ValueType<Func>) => {
      setValue(newValue);
      setValueFor([selectorMemo, optionsMemo]);
    };
    const ref =
      selectorMemo === NO_SELECTOR
        ? observeFunc(callback, optionsMemo)
        : observeFunc(selectorMemo, callback, optionsMemo);
    return () => {
      unobserveFunc(ref);
    };
  }, [moduleObject, optionsMemo, selectorMemo, observeName]);

  // Only return our data if we aren't skipping and have received at least one
  // callback and the selector and options haven't changed, otherwise return the
  // loading value or skip value, as appropriate.
  if (optionsMemo?.skip) {
    return skipValue;
  } else if (
    valueFor &&
    value &&
    valueFor[0] === selectorMemo &&
    valueFor[1] === optionsMemo
  ) {
    return value;
  } else {
    return loadingValue;
  }
}
