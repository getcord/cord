import type { ICordActivitySDK, ICordThreadSDK } from '@cord-sdk/types';
import { logDeprecatedCall } from 'sdk/client/core/cordAPILogger.ts';

/**
 * @deprecated All functions in this class have been renamed.
 */
export class ActivitySDK implements ICordActivitySDK {
  constructor(private thread: ICordThreadSDK) {}

  /**
   * @deprecated Renamed to sdk.thread.observeLocationSummary.
   */
  observeThreadSummary(
    ...args: Parameters<typeof this.thread.observeLocationSummary>
  ) {
    logDeprecatedCall('activity.observeLocationSummary');
    return this.thread.observeLocationSummary(...args);
  }

  /**
   * @deprecated Renamed to sdk.thread.unobserveLocationSummary.
   */
  unobserveThreadSummary(
    ...args: Parameters<typeof this.thread.unobserveLocationSummary>
  ) {
    return this.thread.unobserveLocationSummary(...args);
  }
}
