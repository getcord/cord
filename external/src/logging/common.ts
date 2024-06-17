import type { LogLevel, JsonObject } from 'common/types/index.ts';
import type { LogEventInput } from 'external/src/graphql/operations.ts';
import { pageLoadID } from 'external/src/lib/ids.ts';

// This counter will be incremented with every out-bound event
let eventNumber = 0;

export const createLogEvent = (
  type: string,
  logLevel: LogLevel,
  payload: JsonObject = {},
  metadata: JsonObject = {},
  customEventMetadata?: JsonObject,
): LogEventInput => ({
  pageLoadID,
  installationID: null,
  eventNumber: eventNumber++,
  clientTimestamp: new Date().toISOString(),
  type,
  payload,
  metadata,
  logLevel,
  customEventMetadata,
});

export const sharedMetadata = {
  userAgent: window.navigator.userAgent,
  doNotTrack: window.navigator.doNotTrack,
  cookieEnabled: window.navigator.cookieEnabled, //When the browser is configured to block third-party cookies, and navigator.cookieEnabled is invoked inside a third-party iframe, it returns true in Safari, Edge Spartan and IE (while trying to set a cookie in such scenario would fail). It returns false in Firefox and Chromium-based browsers.
};
