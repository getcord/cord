import { throttle } from 'radash';
import type {
  ICordActivitySDK,
  ICordAnnotationSDK,
  ICordNotificationSDK,
  ICordPresenceSDK,
  ICordThreadSDK,
  ICordUserSDK,
} from '@cord-sdk/types';
import { CordSDK } from 'sdk/client/core/index.tsx';

const throttled_analytics_funcs: Map<string, () => void> = new Map();

// Add new modules and their types to here to allow them to be used in
// logApiCall
type Modules = {
  activity: ICordActivitySDK;
  annotation: ICordAnnotationSDK;
  notification: ICordNotificationSDK;
  presence: ICordPresenceSDK;
  thread: ICordThreadSDK;
  user: ICordUserSDK;
};

function callWithThrottle(key: string, f: () => unknown) {
  if (!throttled_analytics_funcs.has(key)) {
    throttled_analytics_funcs.set(
      key,
      throttle({ interval: 10 * 60 * 1000 }, f),
    );
  }
  throttled_analytics_funcs.get(key)!();
}

export function logApiCall<T extends keyof Modules>(
  module: T,
  operation: Extract<keyof Modules[T], string>,
) {
  callWithThrottle(`${module}/${operation}`, () =>
    CordSDK.get().logEvent('sdk-js-api-call', {
      module,
      operation,
    }),
  );
}

export function logDeprecatedCall(deprecation: string) {
  callWithThrottle(`deprecation/${deprecation}`, () =>
    CordSDK.get().logDeprecation(deprecation),
  );
}
