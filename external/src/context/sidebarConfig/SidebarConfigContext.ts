import { createContext } from 'react';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

export type SidebarConfigContextValue = {
  showLauncher: boolean;
  showCloseButton: boolean;
  showPresence: boolean;
  showInbox: boolean;
  excludeViewerFromPresence: boolean;
};

export const SidebarConfigContext = createContext<
  SidebarConfigContextValue | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
