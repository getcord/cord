import * as React from 'react';
import { useContext } from 'react';

// This context provides the root element for globally positioned elements
// like tooltips, etc
export const PortalContext = React.createContext<HTMLElement | null>(null);

export const PortalContextProvider = ({
  children,
  target,
}: React.PropsWithChildren<{
  target: HTMLElement | null;
}>) => {
  // If there is a PortalContext provider above us, we want its value.
  // E.g. if we're in a Cord message inside a Cord thread, we should portal to the thread.
  const parentTarget = useContext(PortalContext);
  return (
    <PortalContext.Provider value={parentTarget ?? target}>
      {children}
    </PortalContext.Provider>
  );
};
