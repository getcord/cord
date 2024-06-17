import { EventMutator } from 'server/src/entity/event/EventMutator.ts';
import { Counter } from 'server/src/logging/prometheus.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

const eventCountMetric = Counter({
  name: 'ClientEvent',
  help: 'Log events received from the client',
  labelNames: ['type', 'appID'],
});

export const logEventsMutationResolver: Resolvers['Mutation']['logEvents'] =
  async (_, args, context) => {
    const events = args.events;

    events.forEach((event) => {
      const level = event.logLevel;
      if (level === 'debug') {
        context.segmentLogger.partnerLog(
          event.type,
          { installationID: event.installationID, ...event.metadata },
          event.payload,
          event.customEventMetadata ?? undefined,
        );
      }

      // Winston will automatically append any `message` in the `payload` to the
      // main message, but the Sentry stuff we call by hand will not, so combine
      // ourselves so that we don't just see things like "react-error" in #ops
      // but actual useful messages.
      let combinedMessage = event.type;
      if ('message' in event.payload) {
        combinedMessage += `: ${event.payload.message}`;
      }
      context.logger.log(
        level,
        combinedMessage,
        {
          pageLoadID: event.pageLoadID,
          installationID: event.installationID,
          eventNumber: event.eventNumber,
          ...event.payload,
          ...event.metadata,
          version: context.clientVersion,
          message: undefined,
        },
        {
          // make sure Sentry won't aggregate too much into one issue, just
          // because we log everything from this place in the code.
          // See https://docs.sentry.io/platforms/javascript/usage/sdk-fingerprinting/#group-errors-with-greater-granularity
          // In addition to the default attributes, we make `event.type` part of
          // the fingerprint
          sentryFingerPrint: ['{{ default }}', event.type],
        },
      );

      eventCountMetric.inc({
        type: event.type,
        appID: context.session.viewer.platformApplicationID ?? 'null',
      });
    });

    const promises = events.map((event) =>
      new EventMutator(context.session).createEvent(
        event,
        context.clientVersion,
        context.deployment,
      ),
    );
    const created = await Promise.all(promises);
    return events.length === created.filter((result) => !!result).length;
  };
