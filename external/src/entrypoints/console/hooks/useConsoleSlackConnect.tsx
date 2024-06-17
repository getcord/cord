import { useCallback, useEffect, useState } from 'react';
import { APP_ORIGIN } from 'common/const/Urls.ts';
import { openPopupWindow } from 'external/src/lib/auth/utils.ts';
import type { SlackFlowMessageData } from 'external/src/lib/auth/auth-slack-linking-start/index.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { useLazyEncodedSlackTokenQuery } from 'external/src/entrypoints/console/graphql/operations.ts';
import type { UUID } from 'common/types/index.ts';

type Props = {
  applicationID: UUID;
  onSuccess: () => void;
  onError: () => void;
};

export function useConsoleSlackConnect({
  onSuccess,
  onError,
  applicationID,
}: Props) {
  const [popupRef, setPopupRef] = useState<Window | null>();

  const [fetchSlackFlowData, { data: encodedSlackTokenData }] =
    useLazyEncodedSlackTokenQuery();
  const [slackToken, setSlackToken] = useState<string | null>(null);

  const { logEvent } = useLogger();

  useEffect(() => {
    setSlackToken(encodedSlackTokenData?.encodedSlackToken ?? null);
  }, [encodedSlackTokenData]);

  useEffect(() => {
    if (popupRef && slackToken) {
      const message: SlackFlowMessageData = {
        state: slackToken,
        team: null,
      };
      popupRef.postMessage(message, APP_ORIGIN);
      setPopupRef(null);
      setSlackToken(null);
    }
  }, [popupRef, slackToken]);

  useEffect(() => {
    const onMessageImpl = async (event: MessageEvent<any>) => {
      if (event.origin === APP_ORIGIN && event.data?.service === 'slack') {
        switch (event.data.message) {
          case 'oauth_flow_complete': {
            logEvent('connect-service-successful', {
              service: 'slack',
              connectionType: 'support',
            });
            onSuccess();
            break;
          }
          case 'oauth_flow_error': {
            logEvent('connect-service-failed', {
              service: 'slack',
              reason: 'error',
              connectionType: 'support',
            });
            onError();
            break;
          }
          case 'oauth_flow_cancelled':
            logEvent('connect-service-failed', {
              service: 'slack',
              reason: 'cancelled',
              connectionType: 'support',
            });
            onError();
            break;
        }
      }
    };
    const onMessage = (event: MessageEvent<any>) => void onMessageImpl(event);

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onSuccess, onError, logEvent]);

  const connectWithSlackFlow = useCallback(() => {
    const popup = openPopupWindow(
      `${APP_ORIGIN}/auth-slack-linking-start.html#origin=console`,
    );
    logEvent('connect-service-started', { service: 'slack' });
    window.addEventListener('message', (event) => {
      if (event.source === popup && event.data.nonce) {
        void fetchSlackFlowData({
          variables: { nonce: event.data.nonce, applicationID },
        });
      }
    });
    setPopupRef(popup);
    return;
  }, [applicationID, fetchSlackFlowData, logEvent]);

  return connectWithSlackFlow;
}
