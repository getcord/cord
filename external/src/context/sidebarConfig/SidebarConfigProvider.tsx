import { useMemo } from 'react';
import type { SidebarConfigContextValue } from 'external/src/context/sidebarConfig/SidebarConfigContext.ts';
import { SidebarConfigContext } from 'external/src/context/sidebarConfig/SidebarConfigContext.ts';

export function SidebarConfigProvider({
  showLauncher,
  showCloseButton,
  showPresence,
  showInbox,
  excludeViewerFromPresence,
  children,
}: React.PropsWithChildren<SidebarConfigContextValue>) {
  const value = useMemo<SidebarConfigContextValue>(
    () => ({
      showLauncher,
      showCloseButton,
      showInbox,
      showPresence,
      excludeViewerFromPresence,
    }),
    [
      showLauncher,
      showCloseButton,
      showInbox,
      showPresence,
      excludeViewerFromPresence,
    ],
  );

  return (
    <SidebarConfigContext.Provider value={value}>
      {children}
    </SidebarConfigContext.Provider>
  );
}
