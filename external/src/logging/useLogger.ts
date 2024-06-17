import { useCallback, useContext, useMemo, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import * as Sentry from '@sentry/react';

import { serializeError } from 'serialize-error';
import {
  useLogDeprecationMutation,
  useLogEventsMutation,
} from 'external/src/graphql/operations.ts';
import { createLogEvent, sharedMetadata } from 'external/src/logging/common.ts';
import type {
  JsonObject,
  PageContext as PageContextType,
} from 'common/types/index.ts';
import { LogLevel } from 'common/types/index.ts';
import { eventMetadataFromPageDetails } from 'external/src/logging/metadata.ts';
import { PageContext } from 'external/src/context/page/PageContext.ts';
import { ApplicationContext } from 'external/src/context/embed/ApplicationContext.tsx';
import type {
  EventName,
  EventPayload,
  LogEventFn,
} from 'external/src/lib/analytics.ts';
import { PageUrlContext } from 'external/src/context/page/PageUrlContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

// In its current form, this works okay but it can and will lose events.
// Specifically, any events fired just as the page is tearing down will
// likely be lost. The smart move here is to buffer all events through
// localStorage first and to consume the events from localStorage
// periodically. This change is already quite involved, so I'm saving
// that bit for later.

const TIMED_EVENT_PAIR_KEY = 'pairUUID';
const TIMED_EVENT_PAIR_TYPE_KEY = 'pairType';
const TIMED_EVENT_PAIR_DURATION_KEY = 'durationMs';

// Convert our log level to the Sentry one.
// We do not log DEBUG and INFO events to Sentry.
const SENTRY_LOG_LEVELS: Record<LogLevel, Sentry.SeverityLevel | undefined> = {
  [LogLevel.WARN]: 'warning',
  [LogLevel.ERROR]: 'error',
  [LogLevel.DEBUG]: undefined,
  [LogLevel.INFO]: undefined,
};

export function useLogger() {
  const pageContext = useContextThrowingIfNoProvider(PageContext);
  const application = useContextThrowingIfNoProvider(ApplicationContext);
  const pageUrl = useContextThrowingIfNoProvider(PageUrlContext);
  const { customEventMetadata } =
    useContextThrowingIfNoProvider(ConfigurationContext);
  const orgContext = useContext(OrganizationContext);
  const threadContext = useContext(Thread2Context);
  const pageContextRef = useRef<PageContextType | null>(null);
  pageContextRef.current = pageContext ?? null;
  const pageUrlRef = useRef<string | null>(null);
  pageUrlRef.current = pageUrl ?? null;

  const [logEvents] = useLogEventsMutation();
  const [logDeprecationMutation] = useLogDeprecationMutation();

  const threadExternalOrgID =
    threadContext !== NO_PROVIDER_DEFINED
      ? threadContext.thread?.externalOrgID
      : undefined;

  const orgID =
    orgContext !== NO_PROVIDER_DEFINED
      ? orgContext?.organization?.externalID
      : undefined;

  const orgIDToQuery = threadExternalOrgID ?? orgID;

  const logWithLevel = useCallback(
    (
      type: string,
      logLevel: LogLevel,
      payload: JsonObject = {},
      metadata: JsonObject = {},
    ) => {
      // Add page context information to metadata
      metadata = {
        ...(pageContextRef.current
          ? eventMetadataFromPageDetails(
              pageContextRef.current.providerID,
              pageUrlRef.current,
            )
          : {}),
        ...sharedMetadata,
        applicationEnvironment: application?.applicationEnvironment,
        ...metadata,
      };

      //  Log to Sentry
      const sentryLevel = SENTRY_LOG_LEVELS[logLevel];

      if (sentryLevel) {
        metadata.sentryEventID = Sentry.captureMessage(type, {
          level: sentryLevel,
          extra: { payload, metadata },
        });
      }
      // Log to server. At the moment, we're only supporting logging one event
      // at a time. Batching events is tricky, so we'll save that for a
      // follow-up change.
      void logEvents({
        variables: {
          // XXX
          events: [
            createLogEvent(
              type,
              logLevel,
              payload,
              metadata,
              customEventMetadata,
            ),
          ],
          _externalOrgID: orgIDToQuery,
        },
      });
    },
    [
      application?.applicationEnvironment,
      customEventMetadata,
      logEvents,
      orgIDToQuery,
    ],
  );

  const logEvent: LogEventFn = useCallback(
    <E extends EventName>(
      eventName: E,
      ...args: EventPayload<E> extends never ? [] : [EventPayload<E>]
    ) => logWithLevel(eventName, LogLevel.DEBUG, args[0]),
    [logWithLevel],
  );

  const logWarning = useCallback(
    (type: string, payload: JsonObject = {}, metadata: JsonObject = {}) =>
      logWithLevel(type, LogLevel.WARN, payload, metadata),
    [logWithLevel],
  );

  const logInfo = useCallback(
    (type: string, payload: JsonObject = {}, metadata: JsonObject = {}) =>
      logWithLevel(type, LogLevel.INFO, payload, metadata),
    [logWithLevel],
  );

  const logDebug = useCallback(
    (type: string, payload: JsonObject = {}, metadata: JsonObject = {}) =>
      logWithLevel(type, LogLevel.DEBUG, payload, metadata),
    [logWithLevel],
  );

  const logError = useCallback(
    (type: string, payload: JsonObject = {}, metadata: JsonObject = {}) =>
      logWithLevel(type, LogLevel.ERROR, payload, metadata),
    [logWithLevel],
  );

  const logException = useCallback(
    (
      type: string,
      error: any,
      payload: JsonObject = {},
      metadata: JsonObject = {},
    ) =>
      logWithLevel(
        type,
        LogLevel.ERROR,
        { error: serializeError(error, { maxDepth: 50 }), ...payload },
        metadata,
      ),
    [logWithLevel],
  );

  const logDeprecation = useCallback(
    (key: string) => {
      void logDeprecationMutation({
        variables: {
          key,
        },
      });
    },
    [logDeprecationMutation],
  );

  // For timing of things, this offers a simple API:
  //   - Call `startTimeEvent(...)` to begin the timer
  //   - Calling `startTimedEvent` will return a callback to be executed
  //     whenever the event has finished. This callback will create the matching
  //     end event that corresponds to the starting event.
  //
  // A less network-chatty API would be to encode all the information for both starts
  // and finishes into a single event. It may be that we want that tradeoff at some
  // point. There is a liability there though -- specically, we could be losing
  // end events due to network outages, the user's computer crashing, or bugs in
  // our code preventing the end event callback from ever firing. If we only rely
  // on the end events to deliver both the start and end info, we're potentially
  // losing important signal about the health of our system. So, this API currently
  // sends two events for ever start/end pair.
  const startTimedEvent = useCallback(
    <E extends EventName>(
      eventName: E,
      ...args: EventPayload<E> extends never ? [] : [EventPayload<E>]
    ) => {
      const eventPairUUID = uuid();
      const timeAtStart = Date.now();
      logWithLevel(eventName, LogLevel.DEBUG, {
        ...args[0],
        [TIMED_EVENT_PAIR_KEY]: eventPairUUID,
        [TIMED_EVENT_PAIR_TYPE_KEY]: 'start',
      });

      return (endPayload: JsonObject = {}) => {
        logWithLevel(eventName, LogLevel.DEBUG, {
          ...args[0],
          ...endPayload,
          // It's somewhat dubious to double up the logging of the start payload,
          // but it will greatly simplify the queries on the server side.
          // Trade offs. Happy to reduce this down to just and ending payload
          // or no end payload at all.
          [TIMED_EVENT_PAIR_KEY]: eventPairUUID,
          [TIMED_EVENT_PAIR_TYPE_KEY]: 'end',
          [TIMED_EVENT_PAIR_DURATION_KEY]: Date.now() - timeAtStart,
        });
      };
    },
    [logWithLevel],
  );

  return useMemo(
    () => ({
      logEvent,
      logInfo,
      logDebug,
      logWarning,
      logError,
      startTimedEvent,
      logException,
      logDeprecation,
    }),
    [
      logEvent,
      logInfo,
      logDebug,
      logWarning,
      logError,
      startTimedEvent,
      logException,
      logDeprecation,
    ],
  );
}
