import * as React from 'react';

import { useCallback } from 'react';
import { PortalContextProvider } from '../../contexts/PortalContext.js';

interface Props {
  children?: React.ReactNode;
}

/**
 * High Order Component (HOC) that adds Portal target.
 * WrappedComponent must not be a Portal without a specific
 * `target`.
 */
export default function withPortal<T extends Props = Props>(
  WrappedComponent: React.ComponentType<T>,
) {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithPortal = React.forwardRef(
    (props: T, ref: React.ForwardedRef<HTMLElement>) => {
      const [portalTarget, setPortalTarget] =
        React.useState<HTMLElement | null>(null);

      const composedRef = useCallback(
        (newRef: HTMLDivElement) => {
          setPortalTarget(newRef);
          if (typeof ref === 'function') {
            ref(newRef);
          } else {
            ref && 'current' in ref && (ref.current = newRef);
          }
        },
        [ref],
      );

      return (
        <PortalContextProvider target={portalTarget}>
          <WrappedComponent ref={composedRef} {...props} />
        </PortalContextProvider>
      );
    },
  );

  ComponentWithPortal.displayName = `withPortal(${displayName})`;

  return ComponentWithPortal;
}
