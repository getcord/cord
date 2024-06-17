import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { AUTH0_AUDIENCE } from 'external/src/entrypoints/console/const.ts';

import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';
import { DirectNetworkProvider } from 'external/src/context/network/DirectNetworkProvider.tsx';
import { CONSOLE_SERVER_HOST } from 'common/const/Urls.ts';
import type { ErrorCallback } from 'external/src/common/apolloClient.ts';
import { AuthErrorPage } from 'external/src/entrypoints/console/components/AuthErrorPage.tsx';

// Experimentation indicates that the Auth0 SDK will request a new token if the
// current token has less than 60 seconds of validity left, so poll the token
// every 30 seconds to trigger a refresh with plenty of time.
const TOKEN_REFRESH_INTERVAL_MS = 30 * 1000;

type ConsoleAuthContextProps = {
  connected: boolean;
};

export const ConsoleAuthContext = createContext<
  ConsoleAuthContextProps | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);

type ConsoleError = 'duplicate_auth0_account' | 'unexpected_auth_error';

export function ConsoleAuthContextProvider(
  props: React.PropsWithChildren<any>,
) {
  const [token, setToken] = useState<string | null>(null);
  const { getAccessTokenSilently, isAuthenticated, user, logout } = useAuth0();
  const [errorMessage, setErrorMessage] = useState<ConsoleError>();

  useEffect(() => {
    if (isAuthenticated) {
      const refreshToken = async () => {
        try {
          const auth0Token = await getAccessTokenSilently({
            audience: AUTH0_AUDIENCE,
          });
          setToken(auth0Token);
        } catch (e) {
          console.error(e);
        }
      };
      void refreshToken();
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      const intervalID = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL_MS);

      return () => clearInterval(intervalID);
    } else {
      setToken(null);
    }
    return undefined;
  }, [getAccessTokenSilently, isAuthenticated, setToken]);

  const onConnectError: ErrorCallback = useCallback((error) => {
    // Yes this is slightly hacky but I did not want to dive into the
    // apollo client to also push in the api error code
    let message: ConsoleError = 'unexpected_auth_error';

    if (
      // This string is from the ApiErrors /monorepo/server/src/public/routes/platform/util.ts
      error.message.includes(
        'User has logged in with different connection type.',
      )
    ) {
      message = 'duplicate_auth0_account';
    }
    setToken(null);
    setErrorMessage(message);
  }, []);

  const contextValue = useMemo(
    () => ({
      connected: token !== null,
    }),
    [token],
  );

  return (
    <ConsoleAuthContext.Provider value={contextValue}>
      {!errorMessage ? (
        <DirectNetworkProvider
          apiHost={CONSOLE_SERVER_HOST}
          logGraphQLErrors={true}
          fetchAccessToken={false}
          token={token}
          errorCallback={onConnectError}
        >
          {props.children}
        </DirectNetworkProvider>
      ) : (
        <AuthErrorPage
          errorMessage={errorMessage}
          email={user?.email}
          logout={logout}
        />
      )}
    </ConsoleAuthContext.Provider>
  );
}
