import type {
  PubSubAsyncIteratorArg,
  PubSubEvent,
  PubSubEventName,
} from 'server/src/pubsub/index.ts';
import {
  unsubscribeFromPubSub,
  subscribeToPubSubEvent,
} from 'server/src/pubsub/index.ts';
import { AsyncChannel } from 'server/src/util/AsyncChannel.ts';

export const NO_VALUE = Symbol('NO_OUTPUT');
export type NoValue = typeof NO_VALUE;

/**
 * Returns an async iterable that will fulfill the needs of a live query.  The
 * first argument is a set of pubsub topics to listen to, which will produce
 * events; the second argument is a function that is called immediately to
 * produce the set of data to send when the subscription starts; and the third
 * argument is a function to convert pubsub events into return values for the
 * live query.
 */
export async function liveQuery<T extends PubSubEventName, S>(
  events: Array<PubSubAsyncIteratorArg<T>>,
  initialData: () => S | NoValue | Promise<S | NoValue>,
  eventData: (event: PubSubEvent<T>) => S | NoValue | Promise<S | NoValue>,
): Promise<AsyncIterable<S>> {
  const channel = new AsyncChannel<PubSubEvent<T>>();
  const pubSubSubscriptions: number[] = [];
  for (const event of events) {
    pubSubSubscriptions.push(
      await subscribeToPubSubEvent(event[0] as any, event[1], (e) =>
        channel.push(e),
      ),
    );
  }

  let running = true;

  const shutdown = async () => {
    if (running) {
      running = false;
      channel.return();
      pubSubSubscriptions.map((subscription) =>
        unsubscribeFromPubSub(subscription),
      );
    }
  };

  let firstCall = true;

  const iterator: AsyncIterator<S> = {
    async next() {
      if (!running) {
        return { done: true, value: undefined };
      }
      if (firstCall) {
        firstCall = false;
        const result = await initialData();
        if (result !== NO_VALUE) {
          return { done: false, value: result };
        }
      }
      const event = await channel.next();
      if (event.done) {
        await shutdown();
        return event;
      }
      const result = await eventData(event.value);
      if (result !== NO_VALUE) {
        return { done: false, value: result };
      }
      return await this.next();
    },
    async return() {
      await shutdown();
      return { done: true, value: undefined };
    },
    async throw(error) {
      await shutdown();
      throw error;
    },
  };

  return {
    [Symbol.asyncIterator]() {
      return iterator;
    },
  };
}
