/** @jsxImportSource @emotion/react */

import { useEffect, useRef, useState } from 'react';
import { CordProvider } from '@cord-sdk/react';
import { API_SERVER_HOST, APP_SERVER_HOST } from 'common/const/Urls.ts';
import { CordThreadCanaryExample } from 'sdk/test/examples/cordThreadCanary.tsx';
import { CordReplacementsExample } from 'sdk/test/examples/cordReplacementsExample.tsx';

function useStateWithLocalStoragePersistence<T>(
  key: string,
): readonly [T | undefined, (value: T | undefined) => void];

function useStateWithLocalStoragePersistence<T>(
  key: string,
  defaultValue: T,
): readonly [T, (value: T) => void];

function useStateWithLocalStoragePersistence<T>(key: string, defaultValue?: T) {
  const [value, setValue] = useState(() => {
    const localStorageValue = localStorage.getItem(key);
    if (localStorageValue === null) {
      return defaultValue;
    }

    return JSON.parse(localStorageValue) as T;
  });

  useEffect(() => {
    if (value !== null && value !== undefined) {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.removeItem(key);
    }
  }, [key, value]);

  return [value, setValue] as const;
}

const PAGES = ['testbed', 'foo', 'bar'] as const;
type Page = (typeof PAGES)[number];

const COMPONENT_SETS = ['threads', 'replacements', 'all'] as const;
type ComponentSet = (typeof COMPONENT_SETS)[number];

export function CanaryTestbed() {
  const [tokens, setTokens] = useState<undefined | Record<string, string>>(
    undefined,
  );

  const [user, setUser] = useStateWithLocalStoragePersistence<string>(
    'user_canary',
    'andrei',
  );

  const [page, setPage] = useStateWithLocalStoragePersistence<Page>(
    'page',
    'testbed',
  );

  const [componentSet, setComponentSet] =
    useStateWithLocalStoragePersistence<ComponentSet>(
      'component_set_canary',
      'all',
    );

  const allPagesSettingsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (tokens === undefined) {
      // figure out reorder here
      void fetch(new Request(`https://${API_SERVER_HOST}/sdk/test/tokens`), {
        // send cookies in cross origin requests
        credentials: 'include',
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch tokens: ${response.status}`);
          }
          return response.json();
        })
        .then((tokensObj) => {
          const reordered = Object.keys(tokensObj)
            .sort((a, b) =>
              a.includes('without_org') && !b.includes('without_org') ? -1 : 0,
            )
            .reduce(
              (obj, key) => {
                obj[key] = tokensObj[key];
                return obj;
              },
              {} as Record<string, string>,
            );

          setTokens(reordered);
        });
    }
  }, [tokens]);

  useEffect(() => {
    if (tokens && !tokens[user]) {
      setUser('andrei_without_org');
    }
  }, [setUser, tokens, user]);

  if (tokens === undefined) {
    return <p>Loading...</p>;
  }

  return (
    <CordProvider
      clientAuthToken={tokens[user]}
      cordScriptUrl={`https://${APP_SERVER_HOST}/sdk/v1/sdk.latest.js`}
      onInitError={(e) => console.log('onInitError', e)}
      customEventMetadata={{ foo: { bar: 'baz' } }}
    >
      <div className="page-wide-settings" ref={allPagesSettingsRef}>
        <h3>All Pages Settings</h3>
        <p>
          User:{' '}
          <select
            onChange={(e) => {
              const result = setUser(e.target.value);
              // Refresh the tokens if the user changes,
              // just in case it has been more than a minute
              setTokens(undefined);
              return result;
            }}
            value={user}
          >
            {/* eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one! */}
            {Object.keys(tokens).map((user) => (
              <option key={user} disabled={!user.includes('without_org')}>
                {user}
              </option>
            ))}
          </select>{' '}
        </p>
        <p>
          Location page:
          <select
            onChange={(e) => setPage(e.target.value as Page)}
            value={page}
          >
            {/* eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one! */}
            {PAGES.map((page) => (
              <option key={page} value={page}>
                {page}
              </option>
            ))}
          </select>
        </p>
        <label>
          Component set:{' '}
          <select
            onChange={(e) => {
              setComponentSet(e.target.value as ComponentSet);
            }}
            value={componentSet}
          >
            {COMPONENT_SETS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      {(componentSet === 'threads' || componentSet === 'all') && (
        <CordThreadCanaryExample />
      )}
      {(componentSet === 'replacements' || componentSet === 'all') && (
        <CordReplacementsExample />
      )}
    </CordProvider>
  );
}
