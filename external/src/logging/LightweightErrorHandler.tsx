import { useCallback } from 'react';
import * as Sentry from '@sentry/react';
import { useLogEventsMutation } from 'external/src/graphql/operations.ts';
import { LogLevel } from 'common/types/index.ts';
import { createLogEvent } from 'external/src/logging/common.ts';
import {
  HACKS_PANEL_EXCEPTION_NON_RENDER,
  HACKS_PANEL_EXCEPTION_RENDER,
  parseStack,
} from 'external/src/logging/ErrorHandler.tsx';

/*  ATTENTION: DO NOT USE the LightweightErrorHandler if you
    are able to use the proper <ErrorHandler> component.
    
    This component omits important logging information and should
    only be used if it is impossible to access the contexts that
    the ErrorHandler component needs.
*/
export function LightweightErrorHandler({
  children,
}: React.PropsWithChildren<any>) {
  const [logEvents] = useLogEventsMutation();

  const onReactError = useCallback(
    (error: Error, componentStack: string, sentryEventID: string) => {
      if (
        error.message === HACKS_PANEL_EXCEPTION_RENDER ||
        error.message === HACKS_PANEL_EXCEPTION_NON_RENDER
      ) {
        // Yeah, we don't want to log this error server-side.
        return;
      }

      void logEvents({
        variables: {
          events: [
            createLogEvent(
              'react-error-lightweight-error-boundary',
              LogLevel.ERROR,
              {
                message: error.message,
                stack: parseStack(error.stack),
                componentStack: parseStack(componentStack),
                sentryEventID,
              },
            ),
          ],
          _externalOrgID: undefined,
        },
      });
    },
    [logEvents],
  );

  return (
    <Sentry.ErrorBoundary onError={onReactError}>
      {children}
    </Sentry.ErrorBoundary>
  );
}
