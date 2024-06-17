import { useConsoleCordSessionTokenQuery } from 'external/src/entrypoints/console/graphql/operations.ts';
import { CordProvider } from '@cord-sdk/react';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConsoleAuthContext } from 'external/src/entrypoints/console/contexts/ConsoleAuthContextProvider.tsx';

export function CordApp({ children }: React.PropsWithChildren<any>) {
  const { connected } = useContextThrowingIfNoProvider(ConsoleAuthContext);
  const { data } = useConsoleCordSessionTokenQuery({ skip: !connected });

  return (
    <>
      {data?.consoleCordSessionToken ? (
        <CordProvider clientAuthToken={data.consoleCordSessionToken}>
          {children}
        </CordProvider>
      ) : (
        children
      )}
    </>
  );
}
