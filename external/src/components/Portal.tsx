import { createPortal } from 'react-dom';
import { PortalContext } from 'external/src/context/portal/PortalContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

export function Portal({
  children,
  target,
}: React.PropsWithChildren<{ target?: HTMLElement }>) {
  const portalContextElement =
    useContextThrowingIfNoProvider(PortalContext) ?? document.body;
  return createPortal(<>{children}</>, target ?? portalContextElement);
}
