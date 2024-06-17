import { Route, Routes, Navigate } from 'react-router-dom';

import { SidebarRoutes } from 'external/src/entrypoints/sidebar/routes.ts';
import type { UUID } from 'common/types/index.ts';
import { pageContextKey } from 'common/types/index.ts';
import { PageContext } from 'external/src/context/page/PageContext.ts';
import { DeepLinkProvider } from 'external/src/context/deepLink/DeepLinkProvider.tsx';
import { Conversation2 } from 'external/src/components/2/Conversation2.tsx';
import { Hacks } from 'external/src/components/hacks/Hacks.tsx';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

export function SidebarApp(props: {
  sidebarContainerRef: React.RefObject<HTMLDivElement>;
  onThreadOpen?: (threadID: UUID) => unknown;
  onThreadClose?: (threadID: UUID) => unknown;
}) {
  return (
    <DeepLinkProvider>
      <Routes>
        <Route
          path="/"
          element={<Navigate replace to={SidebarRoutes.CONVERSATION} />}
        />
        <Route
          path="/*"
          element={
            <Routes>
              <Route
                path={SidebarRoutes.CONVERSATION}
                element={
                  <PageContext.Consumer>
                    {(pageContext) => {
                      if (pageContext === NO_PROVIDER_DEFINED) {
                        throw new Error('PageContext not wrapped in provider');
                      }
                      return (
                        <Conversation2
                          key={
                            pageContext
                              ? pageContextKey(pageContext)
                              : 'threadsChat'
                          }
                          sidebarContainerRef={props.sidebarContainerRef}
                          onThreadOpen={props.onThreadOpen}
                          onThreadClose={props.onThreadClose}
                        />
                      );
                    }}
                  </PageContext.Consumer>
                }
              />
              <Route
                path={SidebarRoutes.HACKS}
                element={<Hacks closeHacks={() => {}} />}
              />
            </Routes>
          }
        />
      </Routes>
    </DeepLinkProvider>
  );
}
