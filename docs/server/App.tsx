/** @jsxImportSource @emotion/react */

import { useEffect, useMemo, useRef, useState, createContext } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import * as Tooltip from '@radix-ui/react-tooltip';

import DocsCordProvider from 'docs/server/state/DocsCordProvider.tsx';
import PreferenceContextProvider from 'docs/server/state/PreferenceContext.tsx';
import Shell from 'docs/server/ui/shell/Shell.tsx';
import navigation from 'docs/server/navigation.tsx';
import GetStarted from 'docs/server/routes/getStarted/GetStarted.tsx';
import Error404 from 'docs/server/routes/404/404.tsx';
import ClearToken from 'docs/server/routes/clearToken/ClearToken.tsx';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';

function getVersionFromQueryParam(searchParams: string): CordVersion | null {
  const cordVersionParam = new URLSearchParams(searchParams).get('version');

  if (cordVersionParam && ['1.0', '2.0'].includes(cordVersionParam)) {
    return cordVersionParam as CordVersion;
  }
  return null;
}

export type CordVersion = '1.0' | '2.0';

export const VersionContext = createContext<{
  version: CordVersion;
  setVersion: (version: CordVersion) => void;
}>({ version: '1.0', setVersion: (_) => {} });

type AppProps = {
  // showFooter is useful for turning off parts of the page that don't
  // have search-query-related content in them. We use then when generating
  // search embeddings.
  showFooter?: boolean;
  // Ditto the above -- hiding the nav is a useful thing to do to keep the
  // token size of each page down.
  showNav?: boolean;
  queryParams?: { version?: CordVersion; [key: string]: string | undefined };
};

function App({
  showFooter = true,
  showNav = true,
  queryParams = {},
}: AppProps) {
  const location = useLocation();

  const firstLoadRef = useRef(false);
  const hashRef = useUpdatingRef(location.hash);

  const [version, setVersion] = useState<CordVersion>(() => {
    const cordVersion = getVersionFromQueryParam(location.search);
    if (cordVersion) {
      return cordVersion;
    } else if (
      queryParams &&
      queryParams['version'] &&
      ['1.0', '2.0'].includes(queryParams['version'])
    ) {
      return queryParams['version'];
    }
    return '1.0';
  });

  // listen to changes in the query params. With react-router, we don't refresh
  // the whole page but the param might change when navigating
  useEffect(() => {
    const cordVersion = getVersionFromQueryParam(location.search);
    if (cordVersion) {
      setVersion(cordVersion);
    }
  }, [location.search]);

  useEffect(() => {
    if (!firstLoadRef.current) {
      firstLoadRef.current = true;
    } else if (hashRef.current) {
      const elem = document.getElementById(hashRef.current.substring(1));
      // TODO: elem shouldn't be null -- log bad cross-page anchor?
      elem ? elem.scrollIntoView() : window.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, [hashRef, location.pathname]);

  const routes = useMemo(() => {
    const items = [];
    // Special case: / and /get-started are the same page
    items.push(
      <Route key="/get-started" path="/get-started" element={<GetStarted />} />,
    );
    for (const navItem of navigation) {
      items.push(
        <Route
          key={navItem.linkTo}
          path={navItem.linkTo}
          element={navItem.component}
        />,
      );
      if (navItem.subnav) {
        for (const subNavItem of navItem.subnav) {
          items.push(
            <Route
              key={subNavItem.linkTo}
              path={subNavItem.linkTo}
              element={subNavItem.component}
            />,
          );
          if (subNavItem.subnav) {
            for (const subsubNavItem of subNavItem.subnav) {
              items.push(
                <Route
                  key={subsubNavItem.linkTo}
                  path={subsubNavItem.linkTo}
                  element={subsubNavItem.component}
                />,
              );
            }
          }
        }
      }
    }
    return items;
  }, []);

  const shell = (
    <PreferenceContextProvider>
      <DocsCordProvider>
        <Tooltip.Provider delayDuration={0}>
          <VersionContext.Provider value={{ version, setVersion }}>
            <Shell showFooter={showFooter} showNav={showNav}>
              <Routes>
                {routes}
                <Route path="/clear-token" element={<ClearToken />} />
                <Route path="*" element={<Error404 />} />
              </Routes>
            </Shell>
          </VersionContext.Provider>
        </Tooltip.Provider>
      </DocsCordProvider>
    </PreferenceContextProvider>
  );

  return shell;
}

export default App;
