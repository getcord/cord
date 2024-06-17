import { useCallback, useMemo } from 'react';

import { PagePresenceContext } from 'external/src/context/presence/PagePresenceContext.ts';
import { PageVisitorsContext } from 'external/src/context/page/PageVisitorsContext.ts';
import { usersSortedByPresence } from 'external/src/lib/util.ts';
import { InboxContext } from 'external/src/context/inbox/InboxContext.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { SidebarConfigContext } from 'external/src/context/sidebarConfig/SidebarConfigContext.ts';
import { GlobalEventsContext } from 'external/src/context/globalEvents/GlobalEventsContext.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

export function useNavigationController({
  excludeViewerFromPresenceFacepile,
}: {
  excludeViewerFromPresenceFacepile: boolean;
}) {
  const { logEvent } = useLogger();
  const { user: viewer } = useContextThrowingIfNoProvider(IdentityContext);
  const { visitors } = useContextThrowingIfNoProvider(PageVisitorsContext);
  const activeUsers = useContextThrowingIfNoProvider(PagePresenceContext);
  const sidebarConfigCtx = useContextThrowingIfNoProvider(SidebarConfigContext);
  const { count: inboxCount } = useContextThrowingIfNoProvider(InboxContext);

  const isSDK = Boolean(
    useContextThrowingIfNoProvider(ComponentContext)?.element,
  );

  const usersToShow = useMemo(() => {
    const users = usersSortedByPresence(visitors, activeUsers);
    if (excludeViewerFromPresenceFacepile) {
      return users.filter((user) => user.id !== viewer?.id);
    }
    return users;
  }, [visitors, activeUsers, excludeViewerFromPresenceFacepile, viewer?.id]);

  const { triggerGlobalEvent } =
    useContextThrowingIfNoProvider(GlobalEventsContext);

  const handleCloseSidebar = useCallback(() => {
    // tell the delegate the sidebar wishes to be closed
    triggerGlobalEvent(window.top, 'CLOSE_SIDEBAR');
    logEvent('toggle-sidebar-visibility', { to: false });
  }, [logEvent, triggerGlobalEvent]);

  const showCloseButtonBasedOnMode = !isSDK || sidebarConfigCtx.showCloseButton;

  return useMemo(
    () => ({
      inboxCount,
      handleCloseSidebar,
      usersToShow,
      showCloseButton: showCloseButtonBasedOnMode,
      showInbox: sidebarConfigCtx.showInbox,
      showPresence: sidebarConfigCtx.showPresence,
    }),
    [
      inboxCount,
      handleCloseSidebar,
      usersToShow,
      showCloseButtonBasedOnMode,
      sidebarConfigCtx.showInbox,
      sidebarConfigCtx.showPresence,
    ],
  );
}
