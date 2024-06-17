import { APP_ORIGIN } from 'common/const/Urls.ts';

type CreateOauthMessageHandlerProps = {
  onComplete: () => void;
  onError: () => void;
  onCancelled: () => void;
};

/**
 * Listen for Slack OAuth `message` on `window`, and stop
 * listening once we receive a valid message.
 */
export function listenForSlackOAuthMessages({
  onComplete,
  onError,
  onCancelled,
}: CreateOauthMessageHandlerProps) {
  const oauthMessageHandler = (event: MessageEvent<unknown>) => {
    const isValidMessage =
      event.origin === APP_ORIGIN &&
      typeof event.data === 'object' &&
      event.data !== null &&
      'service' in event.data &&
      event.data?.service === 'slack' &&
      'message' in event.data;

    if (isValidMessage) {
      switch (event.data.message) {
        case 'oauth_flow_complete': {
          onComplete();
          break;
        }
        case 'oauth_flow_error': {
          onError();
          break;
        }
        case 'oauth_flow_cancelled':
          onCancelled();
          break;
      }
    }
  };

  window.addEventListener('message', oauthMessageHandler);
  const stopListening = () =>
    window.removeEventListener('message', oauthMessageHandler);

  return stopListening;
}
