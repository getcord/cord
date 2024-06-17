import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { SlackConnectEventsRefType } from 'external/src/context/globalEvents/GlobalEventsContext.tsx';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { listenForSlackOAuthMessages } from 'external/src/lib/auth/oauthMessageHandler.ts';

export type SlackConnectEvents = {
  onSlackConnectSuccessRef: SlackConnectEventsRefType;
  onSlackConnectErrorRef: SlackConnectEventsRefType;
};

/**
 * This is used in the ComponentGLobalEventsProvider so no need to add this anywhere else
 */
export function useSlackConnectEvents(): SlackConnectEvents {
  const { isSlackConnected } = useContextThrowingIfNoProvider(IdentityContext);

  const { logEvent } = useLogger();

  const onSlackConnectSuccessRef = useRef<(() => void) | null>(null);

  const onSlackConnectErrorRef = useRef<(() => void) | null>(null);

  const onSuccessActions = useCallback(async () => {
    onSlackConnectSuccessRef?.current?.();
    haveRunOnSuccess.current = true;
    logEvent('connect-service-successful', { service: 'slack' });
  }, [logEvent]);

  // There are two useEffects below which could run the onSuccess prop.  We only
  // want to run it first - so store a way to check whether it has already been
  // run, and if so don't run it again
  const haveRunOnSuccess = useRef(false);

  const prevIsSlackConnected = useRef(isSlackConnected);

  const onComplete = useCallback(() => {
    if (!haveRunOnSuccess.current) {
      void onSuccessActions();
    }
  }, [onSuccessActions]);

  const onError = useCallback(() => {
    logEvent('connect-service-failed', {
      service: 'slack',
      reason: 'error',
    });
    onSlackConnectErrorRef.current?.();
  }, [logEvent]);

  const onCancelled = useCallback(() => {
    logEvent('connect-service-failed', {
      service: 'slack',
      reason: 'cancelled',
    });
    onSlackConnectErrorRef.current?.();
  }, [logEvent]);

  useEffect(() => {
    const stopListening = listenForSlackOAuthMessages({
      onComplete,
      onError,
      onCancelled,
    });

    return () => stopListening();
  }, [onCancelled, onComplete, onError]);

  // We added this useEffect as a backup for signalling the successful linking
  // flow, in the case that we are blocked from sending a message back to this
  // window from our popup.
  useEffect(() => {
    if (
      // only want to run if the user is NEWLY connected to Slack
      !prevIsSlackConnected.current &&
      isSlackConnected &&
      !haveRunOnSuccess.current
    ) {
      void onSuccessActions();
    }

    if (!isSlackConnected) {
      haveRunOnSuccess.current = false;
    }
  }, [isSlackConnected, haveRunOnSuccess, logEvent, onSuccessActions]);

  const slackEvents: SlackConnectEvents = useMemo(
    () => ({
      onSlackConnectErrorRef,
      onSlackConnectSuccessRef,
    }),
    [],
  );

  return slackEvents;
}
