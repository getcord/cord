import type { SidebarConfigContextValue } from 'external/src/context/sidebarConfig/SidebarConfigContext.ts';

export type InitialIFrameState = {
  visible: boolean;
  // showPinsOnPage used to be part of SidebarConfigContextValue.
  // However, other components can now render pins (e.g. FloatingThreads).
  // Hence why it's separated.
  sidebarConfig: SidebarConfigContextValue & { showPinsOnPage: boolean };
};
