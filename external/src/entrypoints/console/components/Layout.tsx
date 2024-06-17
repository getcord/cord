import { useAuth0 } from '@auth0/auth0-react';

import { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Loading } from 'external/src/entrypoints/console/components/Loading.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConsoleAuthContext } from 'external/src/entrypoints/console/contexts/ConsoleAuthContextProvider.tsx';
import LayoutLoaded from 'external/src/entrypoints/console/components/LayoutLoaded.tsx';
import { ConsoleThemeProvider } from 'external/src/entrypoints/console/contexts/ConsoleThemeProvider.tsx';

const queryClient = new QueryClient();
export interface LayoutProps {
  title: string;
}

export const SPACING_BASE = 8;

export default function Layout(props: React.PropsWithChildren<LayoutProps>) {
  const { isAuthenticated, isLoading } = useAuth0();
  const { connected } = useContextThrowingIfNoProvider(ConsoleAuthContext);

  const loading = useMemo(
    () => isLoading || (isAuthenticated && !connected),
    [connected, isAuthenticated, isLoading],
  );

  return (
    <ConsoleThemeProvider>
      <QueryClientProvider client={queryClient}>
        {loading ? <Loading /> : <LayoutLoaded {...props} />}
      </QueryClientProvider>
    </ConsoleThemeProvider>
  );
}
