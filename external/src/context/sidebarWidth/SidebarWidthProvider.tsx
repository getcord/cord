import { SidebarWidthContext } from 'external/src/context/sidebarWidth/SidebarWidthContext.ts';

/**
 * SidebarWidthContext is only needed in the Extension.
 * SDK sidebar doesn't use it, so value={0} has no effect there.
 */
export function DisabledSidebarWidthProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  return (
    <SidebarWidthContext.Provider value={0}>
      {children}
    </SidebarWidthContext.Provider>
  );
}
