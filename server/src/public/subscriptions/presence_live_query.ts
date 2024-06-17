import type { UUID } from '@cord-sdk/types';
import type { Location } from 'common/types/index.ts';
import {
  isLocation,
  locationEqual,
  locationMatches,
} from 'common/types/index.ts';
import {
  assertViewerHasOrgs,
  assertViewerHasUser,
} from 'server/src/auth/index.ts';
import {
  getAllUserPresence,
  getUserPresence,
} from 'server/src/presence/context.ts';
import { NO_VALUE } from 'server/src/public/subscriptions/util/live_query.ts';
import { liveQueryWithRestartEvent } from 'server/src/public/subscriptions/util/restart_subscription.ts';
import type {
  PresenceLiveQueryData,
  Resolvers,
} from 'server/src/schema/resolverTypes.ts';

export type UserLocation = {
  externalUserID: UUID;
  ephemeral?: {
    contexts: Location[] | null;
  };
  durable?: {
    context: Location;
    timestamp: number;
  };
};

export const presenceLiveQueryResolver: Resolvers['Subscription']['presenceLiveQuery'] =
  {
    resolve: (payload) => payload,
    subscribe: async (
      _root,
      args,
      context,
    ): Promise<AsyncIterable<PresenceLiveQueryData>> => {
      const orgIDs = assertViewerHasOrgs(context.session.viewer);
      const userID = assertViewerHasUser(context.session.viewer);
      if (!isLocation(args.input.matcher)) {
        throw new Error('Invalid matcher');
      }
      const matcher = args.input.matcher;
      const exactMatch = args.input.exactMatch;
      const matches = exactMatch
        ? (c: Location) => locationEqual(c, matcher)
        : (c: Location) => locationMatches(c, matcher);
      const includeDurable = !args.input.excludeDurable;

      // We cache the existing lists by org/user pair, so that we don't have to
      // refetch when an update comes in for one org/user pair
      const ephemeralCache = new Map<string, Location[]>();

      return await liveQueryWithRestartEvent({
        events: orgIDs.map((orgID) => ['context-presence', { orgID }]),
        initialData: async (): Promise<PresenceLiveQueryData> => {
          const durablePromise = includeDurable
            ? context.loaders.pageVisitorLoader.latestForContext(
                matcher,
                exactMatch,
              )
            : Promise.resolve(new Map());
          const [ephemerals, durable] = await Promise.all([
            Promise.all(orgIDs.map(getAllUserPresence)),
            durablePromise,
          ]);
          ephemeralCache.clear();
          for (let i = 0; i < orgIDs.length; i++) {
            for (const ephUserID of ephemerals[i].keys()) {
              const values = (ephemerals[i].get(ephUserID) ?? []).filter(
                matches,
              );
              if (values.length > 0) {
                ephemeralCache.set(`${orgIDs[i]}/${ephUserID}`, values);
              }
            }
          }
          const result = [];
          for (const externalUserID of new Set([
            ...ephemerals.flatMap((ephemeral) => [...ephemeral.keys()]),
            ...durable.keys(),
          ])) {
            const eph = ephemerals
              .flatMap((ephemeral) => ephemeral.get(externalUserID) ?? [])
              .filter(matches);
            result.push({
              externalUserID,
              ephemeral: eph.length > 0 ? { contexts: eph } : undefined,
              durable: durable.get(externalUserID),
            });
          }
          return {
            data: result.filter((r) => r.durable || r.ephemeral),
            complete: true,
          };
        },
        eventData: async ({ args: eventArgs, payload }) => {
          if ('durable' in payload) {
            if (!includeDurable || !matches(payload.durable.context)) {
              return NO_VALUE;
            }
            return { data: [payload], complete: false };
          }
          if (
            !(
              (payload.ephemeral.arrived &&
                matches(payload.ephemeral.arrived)) ||
              (payload.ephemeral.departed &&
                matches(payload.ephemeral.departed))
            )
          ) {
            return NO_VALUE;
          }
          const rawData = await getUserPresence(
            eventArgs.orgID,
            payload.externalUserID,
          );
          const newValues = rawData.contexts.filter(matches);
          if (newValues.length === 0) {
            ephemeralCache.delete(
              `${eventArgs.orgID}/${payload.externalUserID}`,
            );
          } else {
            ephemeralCache.set(
              `${eventArgs.orgID}/${payload.externalUserID}`,
              newValues,
            );
          }
          const allLocations = orgIDs.flatMap(
            (orgID) =>
              ephemeralCache.get(`${orgID}/${payload.externalUserID}`) ?? [],
          );
          return {
            data: [
              {
                externalUserID: payload.externalUserID,
                ephemeral: {
                  contexts: allLocations.length > 0 ? allLocations : null,
                },
              },
            ],
            complete: false,
          };
        },
        userID,
        subscriptionName: 'presenceLiveQueryResolver',
      });
    },
  };
