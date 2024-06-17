import type { Location } from '@cord-sdk/types';

import { ComponentPageContextProvider } from 'sdk/client/core/react/ComponentPageContextProvider.tsx';
import { useSidebarController } from 'external/src/delegate/hooks/useSidebarController.ts';
import { EmbedProvider } from 'external/src/context/embed/EmbedProvider.tsx';
import { ErrorHandler } from 'external/src/logging/ErrorHandler.tsx';
import { InboxProvider } from 'external/src/context/inbox/InboxProvider.tsx';
import { AnnotationsOnPageProvider } from 'external/src/context/annotationsOnPage/AnnotationsOnPageProvider.tsx';
import { PagePresenceAndVisitorsShim } from 'sdk/client/core/react/PagePresenceAndVisitorsShim.tsx';
import PresenceObserver from 'sdk/client/core/react/PresenceObserver.tsx';
import { NavigationOverrideProvider } from 'external/src/context/navigation/NavigationOverrideProvider.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';

type Props = {
  location: Location | undefined;
};

export function SidebarProviders(props: React.PropsWithChildren<Props>) {
  const { initialState } = useSidebarController(true, null);
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);

  return (
    initialState && (
      <PagePresenceAndVisitorsShim location={props.location}>
        <PresenceObserver
          // element being absent means to listen just to document visibility.
          location={props.location}
          durable={true}
          groupId={organization?.externalID}
        />
        <EmbedProvider initialState={initialState}>
          <ComponentPageContextProvider location={props.location}>
            <ErrorHandler>
              <InboxProvider>
                <AnnotationsOnPageProvider>
                  <NavigationOverrideProvider>
                    {props.children}
                  </NavigationOverrideProvider>
                </AnnotationsOnPageProvider>
              </InboxProvider>
            </ErrorHandler>
          </ComponentPageContextProvider>
        </EmbedProvider>
      </PagePresenceAndVisitorsShim>
    )
  );
}
