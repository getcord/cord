import { useCallback } from 'react';
import * as Sentry from '@sentry/react';

import { useLogger } from 'external/src/logging/useLogger.ts';

export const HACKS_PANEL_EXCEPTION_RENDER =
  'on-render-path exception triggered in Hacks panel';
export const HACKS_PANEL_EXCEPTION_NON_RENDER =
  'off-render-path exception triggered in Hacks panel';

export const parseStack = (stack?: string) =>
  (stack || '')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

export function ErrorHandler({
  children,
  disabled,
}: React.PropsWithChildren<{ disabled?: boolean }>) {
  const { logError } = useLogger();

  const onReactError = useCallback(
    (error: Error, componentStack: string, sentryEventID: string) => {
      if (
        error.message === HACKS_PANEL_EXCEPTION_RENDER ||
        error.message === HACKS_PANEL_EXCEPTION_NON_RENDER
      ) {
        // Yeah, we don't want to log this error server-side.
        return;
      }

      logError('react-error', {
        message: error.message,
        stack: parseStack(error.stack),
        componentStack: parseStack(componentStack),
        sentryEventID,
      });
    },
    [logError],
  );

  return disabled ? (
    <>{children}</>
  ) : (
    <Sentry.ErrorBoundary onError={onReactError}>
      {children}
    </Sentry.ErrorBoundary>
  );
}
