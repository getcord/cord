import type { PropsWithChildren } from 'react';
import type { NavigateFn } from '@cord-sdk/types';
import { NavigationOverrideContext } from 'external/src/context/navigation/NavigationOverrideContext.ts';
import { EmbedContext } from 'external/src/context/embed/EmbedContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

export function NavigationOverrideProvider({
  navigate,
  children,
}: PropsWithChildren<{ navigate?: NavigateFn | undefined | null }>) {
  const { proxyNavigateOverride } =
    useContextThrowingIfNoProvider(EmbedContext);
  return (
    <NavigationOverrideContext.Provider
      value={{
        navigateOverride: navigate ?? proxyNavigateOverride ?? (() => false),
      }}
    >
      {children}
    </NavigationOverrideContext.Provider>
  );
}
