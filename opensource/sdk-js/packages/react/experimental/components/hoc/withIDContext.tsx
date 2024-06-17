import * as React from 'react';
import { useMemo } from 'react';
import type { IDsType } from '../../contexts/CordIDsContext.js';
import { useCordIDs, CordIDsContext } from '../../contexts/CordIDsContext.js';
import { isEqual } from '../../../common/lib/fast-deep-equal.js';

type Props = {
  children?: React.ReactNode;
};

export type IDsGetterMap<T extends Props = Props> = Partial<
  Record<IDsType, (props: T) => string | undefined>
>;

// High Order Component (HOC) that adds a Context provider for cord IDs (thread, message, user, viewer).
// It only add the provider if there is something new to provide.
export default function withIDContext<T extends Props>(
  WrappedComponent: React.ForwardRefExoticComponent<T>,
  /**
   * A map of ID type -> getter function that retrieve the ID of type from the component props
   */
  IDsGetter: IDsGetterMap<Omit<T, 'children'>>,
) {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function retrieveIDsFromProps(props: T) {
    const retrievedIDs: Partial<Record<IDsType, string>> = Object.fromEntries(
      Object.entries(IDsGetter)
        .map(([idType, getter]) => {
          const maybeID = getter(props);
          if (maybeID) {
            return [idType, maybeID];
          }
          return;
        })
        // We do not want to keep undefined values
        // they would override potentially existing value from above
        .filter(Boolean) as [IDsType, string][],
    );
    return retrievedIDs;
  }

  const ComponentWithIDContext = React.forwardRef(
    (props: T, ref: React.Ref<HTMLElement>) => {
      const fromAbove = useCordIDs();
      const fromHere = retrieveIDsFromProps(props);
      const merged = useMemo(() => {
        // To avoid rerender we only want a new object if an ID actually changed,
        // this is why we need te be comprehensive in the dependencies array.
        return {
          user: fromHere.user || fromAbove.user,
          thread: fromHere.thread || fromAbove.thread,
          message: fromHere.message || fromAbove.message,
        };
      }, [
        fromAbove.user,
        fromAbove.thread,
        fromAbove.message,
        fromHere.user,
        fromHere.thread,
        fromHere.message,
      ]);

      if (isEqual(fromAbove, merged)) {
        return <WrappedComponent ref={ref} {...props} />;
      }
      return (
        <CordIDsContext.Provider value={merged}>
          <WrappedComponent ref={ref} {...props} />
        </CordIDsContext.Provider>
      );
    },
  );

  ComponentWithIDContext.displayName = `withIDContext(${displayName})`;

  return ComponentWithIDContext;
}
