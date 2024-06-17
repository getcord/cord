import type { ApolloClient, ObservableSubscription } from '@apollo/client';
import type {
  ICordPresenceSDK,
  ListenerRef,
  SetPresentOptions,
  UserLocationData,
  Location,
  ObservePresenceOptions,
  PresenceUpdateCallback,
} from '@cord-sdk/types';
import { locationMatches, isLocation } from 'common/types/index.ts';
import type {
  PresenceLiveQuerySubscriptionVariables,
  SetPresentContextMutationResult,
  SetPresentContextMutationVariables,
  PresenceLiveQuerySubscriptionResult,
} from 'external/src/graphql/operations.ts';
import {
  PresenceLiveQuerySubscription,
  SetPresentContextMutation,
} from 'external/src/graphql/operations.ts';
import type { CordInternalCall } from 'sdk/client/core/index.tsx';
import { logApiCall } from 'sdk/client/core/cordAPILogger.ts';
import { throwUnknownApiError } from 'sdk/client/core/util.ts';
import {
  fillUserLocationData,
  toUserLocationData,
} from 'common/util/convertToExternal/presence.ts';

const PRESENCE_SDK_MODULE_NAME = 'presence';

export class PresenceSDK implements ICordPresenceSDK {
  private _observeListeners = new Map<ListenerRef, ObserveListenerState>();
  private _listenerKey = 0;

  constructor(private client: ApolloClient<any>) {}

  async setPresent(
    location: Location,
    options: SetPresentOptions & CordInternalCall,
  ): Promise<true> {
    if (!isLocation(location)) {
      throw new Error('Invalid location');
    }
    if (options.absent && options.durable) {
      throw new Error(
        'Cannot set options.absent and options.durable at the same time.',
      );
    }
    if (options.exclusive_within && !isLocation(options.exclusive_within)) {
      throw new Error('Invalid exclusive_within option');
    }
    if (
      options.exclusive_within &&
      !locationMatches(location, options.exclusive_within)
    ) {
      throw new Error(
        'Cannot set a user present at a location not within the exclusivity region',
      );
    }
    if (!options.__cordInternal) {
      logApiCall(PRESENCE_SDK_MODULE_NAME, 'setPresent');
    }
    const result = await this.client.mutate<
      SetPresentContextMutationResult,
      SetPresentContextMutationVariables
    >({
      mutation: SetPresentContextMutation,
      variables: {
        context: location,
        present: !options.absent,
        durable: !!options.durable,
        exclusivityRegion: options.exclusive_within,
        _externalOrgID: options.groupID,
      },
    });
    if (result.data?.setPresentContext) {
      return true;
    } else if (result.errors?.length) {
      throw result.errors[0];
    } else {
      throwUnknownApiError();
    }
  }

  public observePresence(
    matcher: Location,
    callback: PresenceUpdateCallback,
    options: ObservePresenceOptions & CordInternalCall = {},
  ) {
    if (!isLocation(matcher)) {
      throw new Error('Supplied matcher is not a valid location');
    }
    if (!options.__cordInternal) {
      logApiCall(PRESENCE_SDK_MODULE_NAME, 'observePresence');
    }
    // NOTE(flooey): It's important that we don't mutate objects that we provide
    // to the caller, because they might hold onto references to them, so we
    // copy the array each time we give it to them (so they can strip items out
    // of it or whatever) and create a new object each time we update something
    // in the array
    const data = new Map<string, UserLocationData>();

    const subscription = this.client
      .subscribe<
        PresenceLiveQuerySubscriptionResult,
        PresenceLiveQuerySubscriptionVariables
      >({
        query: PresenceLiveQuerySubscription,
        variables: {
          input: {
            matcher,
            exactMatch: !options.partial_match,
            excludeDurable: !!options.exclude_durable,
          },
          _externalOrgID: undefined,
        },
      })
      .subscribe(({ data: subscriptionData }) => {
        if (subscriptionData) {
          const updated = new Set<string>();
          for (const rawUpdate of subscriptionData.presenceLiveQuery.data) {
            const update = toUserLocationData(rawUpdate);
            if (!data.has(update.id)) {
              data.set(update.id, fillUserLocationData(update));
            } else {
              const newData = { ...data.get(update.id)! };
              if (update.ephemeral) {
                newData.ephemeral = {
                  locations: update.ephemeral.locations ?? [],
                };
              } else if (subscriptionData.presenceLiveQuery.complete) {
                newData.ephemeral = {
                  locations: [],
                };
              }
              if (update.durable) {
                newData.durable = update.durable;
              } else if (subscriptionData.presenceLiveQuery.complete) {
                delete newData.durable;
              }
              data.set(update.id, newData);
            }
            updated.add(update.id);
          }
          if (subscriptionData.presenceLiveQuery.complete) {
            // This was an update with all the data, so anything not mentioned
            // should be set to have no data.  We don't actually delete it to
            // make life easier for the caller (they get an update with an empty
            // array rather than that user disappearing from the data).
            for (const key of [...data.keys()]) {
              if (!updated.has(key)) {
                data.set(key, { id: key, ephemeral: { locations: [] } });
              }
            }
          }
          callback([...data.values()]);
        }
      });
    const key = this._listenerKey++;
    this._observeListeners.set(key, { subscription });
    return key;
  }

  public unobservePresence(ref: ListenerRef): boolean {
    const record = this._observeListeners.get(ref);
    if (!record) {
      return false;
    }

    record.subscription.unsubscribe();
    this._observeListeners.delete(ref);

    return true;
  }

  /**
   * @deprecated Renamed to `observePresence`.
   */
  public observeLocationData(
    matcher: Location,
    callback: PresenceUpdateCallback,
    options: ObservePresenceOptions & CordInternalCall = {},
  ) {
    return this.observePresence(matcher, callback, options);
  }

  public unobserveLocationData(ref: number): boolean {
    return this.unobservePresence(ref);
  }
}

type ObserveListenerState = {
  subscription: ObservableSubscription;
};
