import * as React from 'react';

import { ToastContextProviderPassThrough } from '../../contexts/ToastContext.js';

interface Props {
  children?: React.ReactNode;
}

/**
 * High Order Component (HOC) that adds Toast functionality.
 */
export default function withToast<T extends Props = Props>(
  WrappedComponent: React.ComponentType<T>,
) {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithToast = React.forwardRef(
    (props: T, ref: React.ForwardedRef<HTMLElement>) => {
      return (
        <ToastContextProviderPassThrough>
          <WrappedComponent ref={ref} {...props} />
        </ToastContextProviderPassThrough>
      );
    },
  );

  ComponentWithToast.displayName = `withToast(${displayName})`;

  return ComponentWithToast;
}
