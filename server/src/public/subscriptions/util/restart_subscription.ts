import type { ResolverFn } from 'server/src/public/subscriptions/util/common.ts';
import type { NoValue } from 'server/src/public/subscriptions/util/live_query.ts';
import { liveQuery } from 'server/src/public/subscriptions/util/live_query.ts';
import { withFilter } from 'server/src/public/subscriptions/util/with_filter.ts';
import {
  publishPubSubEvent,
  pubSubAsyncIterator,
} from 'server/src/pubsub/index.ts';
import type {
  PubSubAsyncIteratorArg,
  PubSubEvent,
  PubSubEventName,
} from 'server/src/pubsub/index.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';

export const RESTART_SUBSCRIPTION_ERROR = 'restart-subscription';

export function maybeRestartSubscription<T extends PubSubEventName>(
  event: PubSubEvent<T>,
  operationName: string,
): asserts event is PubSubEvent<Exclude<T, 'restart-subscription'>> {
  if (event.name === 'restart-subscription') {
    throw new Error(RESTART_SUBSCRIPTION_ERROR, { cause: operationName });
  }
}

/**
 * Use this if you want to send a restart pubsub event, this will then
 * trigger a subscription restart in any graphql subscription that listen
 * to this event. Make sure you use withRestartEvent/liveQueryWithRestartEvent
 * within the subscription
 */
export function restartSomeUserSubscriptions(userIDs: string[]) {
  userIDs.forEach((userID) =>
    backgroundPromise(publishPubSubEvent('restart-subscription', { userID })),
  );
}

/**
 * Use this if you want to this specific subscription to restart if the pub
 * sub event 'restart-subscription' is triggered. Use restartSomeUserSubscriptions
 * to publish the event. If you are using a liveQuery, use liveQueryWithRestartEvent.
 */
export function withRestartEvent<T extends PubSubEventNameExRestart>({
  events,
  userID,
  subscriptionName,
}: {
  events: Array<PubSubAsyncIteratorArg<T>>;
  userID: string;
  subscriptionName: string;
}): ResolverFn<PubSubEvent<T>> {
  return withFilter(
    () => {
      const restartEvent: PubSubAsyncIteratorArg<'restart-subscription'> = [
        'restart-subscription',
        { userID },
      ];

      const eventsIncRestart: Array<
        PubSubAsyncIteratorArg<T | 'restart-subscription'>
      > = [...events, restartEvent];
      return pubSubAsyncIterator(...eventsIncRestart);
    },
    (event) => {
      maybeRestartSubscription(event, subscriptionName);
      return true;
    },
  );
}

type PubSubEventNameExRestart = Exclude<
  PubSubEventName,
  'restart-subscription'
>;

/**
 * Use this if you want to this specific subscription to restart if the pub
 * sub event 'restart-subscription' is triggered in a liveQuery. Use restartSomeUserSubscriptions
 * to publish the event.
 */
export async function liveQueryWithRestartEvent<
  T extends PubSubEventNameExRestart,
  S,
>({
  events,
  initialData,
  eventData,
  userID,
  subscriptionName,
}: {
  events: Array<PubSubAsyncIteratorArg<T>>;
  initialData: () => S | Promise<S>;
  eventData: (event: PubSubEvent<T>) => S | NoValue | Promise<S | NoValue>;
  userID: string;
  subscriptionName: string;
}) {
  return await liveQuery<T | 'restart-subscription', S>(
    [...events, ['restart-subscription', { userID }]],
    initialData,
    (event) => {
      maybeRestartSubscription(event, subscriptionName);
      return eventData(event);
    },
  );
}
