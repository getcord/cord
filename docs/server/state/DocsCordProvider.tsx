/** @jsxImportSource @emotion/react */

import { useEffect, useState } from 'react';

import { Helmet } from 'react-helmet';
import AuthProvider from 'docs/server/state/AuthProvider.tsx';
import { CordProvider } from '@cord-sdk/react';

import { hasOwnProperty } from 'docs/lib/hasOwnProperty.ts';
import {
  API_SERVER_HOST,
  APP_SERVER_HOST,
  DOCS_SERVER_HOST,
} from 'common/const/Urls.ts';
import { CORD_DOCS_CLIENT_TOKEN, DOCS_TOKEN_KEY } from 'common/const/Ids.ts';

type DocsCordProviderProps = {
  children: React.ReactNode;
};

function DocsCordProvider({ children }: DocsCordProviderProps) {
  const [sampleToken, setSampleToken] = useState<string | undefined>();
  const [scriptURL, setScriptURL] = useState('');

  useEffect(() => {
    void (async () => {
      if (window.location.pathname.includes('demo-apps')) {
        // The demo apps do their own thing.
        return;
      }

      if (sampleToken === undefined) {
        let oldToken: string | null = null;
        try {
          oldToken = window.localStorage.getItem(CORD_DOCS_CLIENT_TOKEN);
        } catch {
          // Do nothing.
        }

        const res = await fetch(
          `https://${API_SERVER_HOST}/docs-sample-token`,
          {
            method: 'POST',
            body: JSON.stringify({ [DOCS_TOKEN_KEY]: oldToken }),
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
        if (res.ok) {
          try {
            const data = await res.json();
            if (
              hasOwnProperty(data, 'client_auth_token') &&
              typeof data.client_auth_token === 'string'
            ) {
              const token = data.client_auth_token;
              try {
                window.localStorage.setItem(CORD_DOCS_CLIENT_TOKEN, token);
              } catch {
                // Do nothing.
              }
              setSampleToken(token);
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    })();
  }, [sampleToken, setSampleToken]);

  useEffect(() => {
    setScriptURL(`https://${APP_SERVER_HOST}/sdk/v1/sdk.latest.js`);
  }, [setScriptURL]);

  return (
    <AuthProvider clientAuthToken={sampleToken}>
      <Helmet>
        <link
          rel="stylesheet"
          id="cord-react"
          href={`https://${DOCS_SERVER_HOST}/static/css/cord-react.css`}
        />
        <link
          rel="stylesheet"
          id="cord_css"
          href={`https://${APP_SERVER_HOST}/sdk/v1/sdk.latest.css`}
        />
      </Helmet>
      {scriptURL !== '' ? (
        <CordProvider clientAuthToken={sampleToken} cordScriptUrl={scriptURL}>
          {children}
        </CordProvider>
      ) : (
        <>{children}</>
      )}
    </AuthProvider>
  );
}

export default DocsCordProvider;
