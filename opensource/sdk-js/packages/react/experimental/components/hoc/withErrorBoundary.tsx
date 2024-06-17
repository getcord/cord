import * as React from 'react';
import ErrorFallback from '../ErrorFallback.js';

interface Props {
  children?: React.ReactNode;
}

/**
 * High Order Component (HOC) that adds an ErrorBoundary.
 */
export default function withErrorBoundary<T extends Props = Props>(
  WrappedComponent: React.ComponentType<T>,
) {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithErrorBoundary = React.forwardRef(
    (props: T, ref: React.ForwardedRef<HTMLElement>) => {
      return (
        <ErrorBoundary>
          <WrappedComponent ref={ref} {...props} />
        </ErrorBoundary>
      );
    },
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  | { hasError: false }
  | { hasError: true; error: Error; errorInfo: React.ErrorInfo }
> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(error, errorInfo);
  }
  static getDerivedStateFromError(error: Error, errorInfo: React.ErrorInfo) {
    return { hasError: true, error, errorInfo };
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          canBeReplaced
          error={this.state.error}
          errorInfo={this.state.errorInfo}
        />
      );
    }
    return <>{this.props.children}</>;
  }
}
