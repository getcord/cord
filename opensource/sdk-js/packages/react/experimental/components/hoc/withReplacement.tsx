// @ts-ignore TS wants us to `import type` this, but we need it for JSX
import * as React from 'react';
import { useEffect, useMemo } from 'react';

import { useAtomValue } from 'jotai';
import type { WritableAtom } from 'jotai';
import { ScopeProvider } from 'jotai-scope';
import { useHydrateAtoms } from 'jotai/react/utils';
import { registerComponent, replaceRegistry } from '../replacements.js';
import type {
  ComponentName,
  MandatoryReplaceableProps,
  ReplaceConfig,
  ReplaceConfigBase,
} from '../replacements.js';
import {
  logComponentReplacement,
  logComponentUsage,
} from '../../../common/util.js';

export type ReplacementProps = {
  /**
   * Replacement config for components under this one.
   */
  replace?: ReplaceConfig;
  /**
   * Allow the component to be replaced.
   **/
  canBeReplaced?: boolean;
} & MandatoryReplaceableProps;

function isValidReplaceKey(
  key: string,
  replace: ReplaceConfig,
): key is ComponentName {
  return key in replace;
}

/** High Order Component (HOC) that adds sub-component replacement ability.
 * It:
 * - register the component (`WrappedComponent`) as replaceable, by creating an atom whose initial (default) value is `WrappedComponent`
 *
 * At render time it:
 * - renders the component stored in the atom, either the default value (`WrappedComponent`)
 *   or the replacement if a component higher in the tree asked for replacement
 * - read the `replace` props and any replace-within from higher in the tree and create a new atom scope with proper initial values
 *   That way descendants children will have updated atoms.
 **/
// TODO explain the above better if possible.
// We are using jotai to avoid extra re-render and for convenience.
/* @__NO_SIDE_EFFECTS__ */
export default function withReplacement<
  T extends React.PropsWithChildren<ReplacementProps>,
>(WrappedComponent: React.ComponentType<T>, name: ComponentName) {
  // We need to register it that way instead of hard coding to avoid circular dependencies.
  // This works because it happens at import time, outside of React lifecycle.
  registerComponent(name, WrappedComponent);

  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithWrapper = React.forwardRef(
    (props: T & ReplacementProps, ref: React.ForwardedRef<HTMLElement>) => {
      const {
        replace,
        canBeReplaced,
        'data-cord-replace': origReplaceNames,
        ...restProps
      } = props;
      const dataCordReplaceNames = useMemo(
        () =>
          [...(origReplaceNames ?? '').split(', '), name]
            .filter(Boolean)
            .join(', '),
        [origReplaceNames],
      );

      const configFromAboveAtom = replaceRegistry.get(name);
      if (!configFromAboveAtom) {
        // This should never happen, because we register the component at import time (above).
        throw new Error(
          `Cannot find replaceConfig for ${name}. It was not properly registered.`,
        );
      }

      const {
        component: Component = WrappedComponent,
        replace: replaceFromAbove,
      } = useAtomValue(configFromAboveAtom);

      useEffect(() => {
        logComponentUsage(name);
        if (Component !== WrappedComponent) {
          logComponentReplacement(name);
        }
      }, [Component]);

      return (
        <ReplacementConfigScope replace={{ ...replaceFromAbove, ...replace }}>
          {canBeReplaced ? (
            <Component
              ref={ref}
              data-cord-replace={dataCordReplaceNames}
              {...(restProps as T)}
            />
          ) : (
            // This is to avoid infinite loop where a Component is replace with the same Component wrapped
            // TODO change to the opposite, because the user should not have to pass `noReplace`, only us
            <WrappedComponent ref={ref} {...(restProps as T)} />
          )}
        </ReplacementConfigScope>
      );
    },
  );

  ComponentWithWrapper.displayName = `withReplacement(${displayName})`;

  return ComponentWithWrapper;
}

export const Replace = withReplacement(
  ({ children }: React.PropsWithChildren) => <>{children}</>,
  'Replace',
);

/**
 * If a component is not in the `replace` config, we need to read the atom from above.
 * To do so, we use jotai-scope + initial value
 * https://jotai.org/docs/extensions/scope#
 *
 * For example:
 * <Replace replace={CompA: {MyA}, within: { CompB: {CompA: AnotherA, CompC: MyC}}}/>
 * -> [
 *    [compAComponentAtom, {component: MyA}],
 *    [compBComponentAtom, {replace: {CompA: AnotherA, CompC: MyC}}
 *  ]
 **/
function ReplacementConfigScope({
  children,
  replace,
}: React.PropsWithChildren<{ replace?: ReplaceConfig }>) {
  // The array of couple of [atom, value] aka [component, replacement] that will affect the sub tree.
  const atomsValues = React.useMemo(() => {
    const atomMap = new Map<
      ComponentName,
      { component?: unknown; replace?: ReplaceConfigBase }
    >();
    if (!replace) {
      return [];
    }

    // Collect replacements (non within)
    for (const componentName of Object.keys(replace).filter(
      (key) => 'within' !== key,
    )) {
      if (isValidReplaceKey(componentName, replace)) {
        atomMap.set(componentName, {
          component: replace[componentName],
        });
      }
    }

    // update to add 'within' replacements
    if (replace.within) {
      for (const entries of Object.entries(replace.within) as [
        ComponentName,
        ReplaceConfigBase,
      ][]) {
        const [componentName, replaceWithin] = entries;
        const value = atomMap.get(componentName) ?? {};
        value.replace = replaceWithin;
        atomMap.set(componentName, value);
      }
    }

    // build the [atom, initialValue][] that we will pass to the Scope Provider
    const atomValues: AtomTuple<AnyWritableAtom, unknown>[] = [];
    for (const [componentName, config] of atomMap) {
      const compAtom = replaceRegistry.get(componentName);

      if (!compAtom) {
        // This should only happens if user passes a non-existing key.
        // It is recoverable, but we should warn the user, but do not fail.
        console.error(
          `Trying to replace non replaceable: ${componentName}, please check your 'replace' prop.`,
        );
        continue;
      }

      atomValues.push([
        compAtom,
        {
          component: config.component,
          replace: config.replace,
        },
      ]);
    }

    return atomValues;
  }, [replace]);
  return (
    <ScopeProviderWithInitializer atomValues={atomsValues}>
      {children}
    </ScopeProviderWithInitializer>
  );
}

// -----------------------------------------------------------------------------------------------------------
// This is all copy-pasta from https://github.com/jotaijs/jotai-scope/blob/main/examples/03_hybrid/src/App.tsx
// Copied from useHydrateAtoms type signature

type AnyWritableAtom = WritableAtom<unknown, any[], any>;
type AtomTuple<A = AnyWritableAtom, V = unknown> = readonly [A, V];
type InferAtoms<T> = {
  [K in keyof T]: T[K] extends readonly [infer A, unknown]
    ? A extends WritableAtom<unknown, infer Args, any>
      ? readonly [A, Args[0]]
      : T[K]
    : never;
};

const ScopeProviderWithInitializer = <T extends Iterable<AtomTuple>>({
  atomValues,
  children,
}: React.PropsWithChildren<{
  atomValues: InferAtoms<T>;
}>) => {
  const atoms = Array.from(atomValues, ([anAtom]) => anAtom);
  return (
    <ScopeProvider atoms={atoms}>
      <AtomsHydrator atomValues={atomValues}>{children}</AtomsHydrator>
    </ScopeProvider>
  );
};

const AtomsHydrator = <T extends Iterable<AtomTuple>>({
  atomValues,
  children,
}: React.PropsWithChildren<{
  atomValues: InferAtoms<T>;
}>) => {
  useHydrateAtoms(atomValues);
  return children;
};
