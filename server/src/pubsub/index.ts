import * as crypto from 'crypto';
import type { PubSubEngine } from 'graphql-subscriptions';
import { PubSub } from 'graphql-subscriptions';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import jsonStableStringify from 'fast-json-stable-stringify';

import { anonymousLogger } from 'server/src/logging/Logger.ts';
import type { EntityMetadata, Location, UUID } from 'common/types/index.ts';
import { createRedisClient } from 'server/src/redis/index.ts';
import type { SlackMirroredThreadInfo } from 'server/src/schema/resolverTypes.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { LinkedUsersLoader } from 'server/src/entity/linked_users/LinkedUsersLoader.ts';
import { Counter } from 'server/src/logging/prometheus.ts';
import {
  getTypedFeatureFlagValue,
  FeatureFlags,
} from 'server/src/featureflags/index.ts';

let pubSub: PubSubEngine | undefined;

const publishCounter = Counter({
  name: 'PubSubEventPublished',
  help: 'Pub-sub events published',
  labelNames: ['name'],
});

const subscribeCounter = Counter({
  name: 'PubSubEventSubscribed',
  help: 'Pub-sub events subscribed to',
  labelNames: ['name'],
});

export async function initPubSub() {
  if (pubSub !== undefined) {
    throw new Error('PubSub has been already initialised');
  }

  if (process.env.IS_TEST) {
    // in-memory-only pubsub
    pubSub = new PubSub();
  } else {
    pubSub = new RedisPubSub({
      publisher: createRedisClient(),
      subscriber: createRedisClient(),
    });
  }
}

function getPubSub(): PubSubEngine {
  if (pubSub === undefined) {
    throw new Error('PubSub has not been initialised');
  }
  return pubSub;
}

type PubSubEvents = {
  'page-thread-added-with-location': {
    args: { orgID: string };
    payload: { threadID: string; location: Location };
  };
  'page-thread-deleted': {
    args: { orgID: string };
    payload: { threadID: string };
  };
  'thread-filterable-properties-updated': {
    args: { orgID: string };
    payload: {
      threadID: string;
      changes: {
        location?: { old: Location; new: Location };
        resolved?: { old: boolean; new: boolean };
        metadata?: { old: EntityMetadata; new: EntityMetadata };
        orgID?: { old: UUID; new: UUID };
        subscribers?: { added: UUID[]; removed: UUID[] };
      };
    };
  };
  'thread-created': {
    args: { threadID: UUID };
    payload: { threadID: UUID }; // This is redundant, but it makes the ThreadEvents subscription easier to implement
  };
  'thread-deleted': {
    args: { threadID: UUID };
    payload: { threadID: UUID }; // This is redundant, but it makes the ThreadEvents subscription easier to implement
  };
  'thread-message-added': {
    args: { threadID: UUID };
    payload: { messageID: UUID };
  };
  'thread-message-updated': {
    args: { threadID: UUID };
    payload: { messageID: UUID };
  };
  'thread-message-content-appended': {
    args: { threadID: UUID };
    payload: { messageID: UUID; appendedContent: string };
  };
  'thread-message-removed': {
    args: { threadID: UUID };
    payload: { messageID: UUID };
  };
  'thread-participants-updated-incremental': {
    args: { threadID: UUID };
    payload: { userID: UUID };
  };
  'thread-typing-users-updated': {
    args: { threadID: UUID };
    payload: { users: UUID[] };
  };
  'thread-share-to-slack': {
    args: { threadID: UUID };
    payload: { info: SlackMirroredThreadInfo | null };
  };
  'thread-properties-updated': {
    args: { threadID: UUID };
    payload: null;
  };
  'thread-subscriber-updated': {
    args: { threadID: UUID };
    payload: { userID: UUID };
  };
  'inbox-updated': {
    args: { userID: UUID };
    payload: { threadID: string; location: Location } | null;
  };
  'console-getting-started-updated': {
    args: { applicationID: UUID };
    payload: null;
  };
  'user-preference-updated': {
    args: { userID: UUID };
    payload: { key: string };
  };
  'user-identity': {
    args: { userID: UUID };
    payload: null;
  };
  'org-user-identity': {
    args: { orgID: UUID };
    payload: { userID: UUID };
  };
  'annotations-on-page-updated': {
    args: {
      pageContextHash: UUID;
      orgID: UUID;
    };
    payload: null;
  };
  'incoming-slack-event': {
    args: { tier: string };
    payload: {
      type: string;
      event: unknown;
    };
  };
  'pub-sub-health-check': {
    args: null;
    payload: null;
  };
  'notification-added': {
    args: { userID: UUID };
    payload: { notificationID: UUID };
  };
  'notification-read-state-updated': {
    args: { userID: UUID };
    payload: { notificationID: UUID };
  };
  'notification-deleted': {
    args: { userID: UUID };
    payload: { notificationID: UUID };
  };
  'context-presence': {
    args: { orgID: UUID };
    payload: { externalUserID: string } & (
      | {
          ephemeral: {
            arrived?: Location;
            departed?: Location;
            sequenceNum: number;
          };
        }
      | {
          durable: {
            context: Location;
            timestamp: number;
          };
        }
    );
  };
  'org-member-added': {
    args: { orgID: UUID };
    payload: { userID: UUID };
  };
  'org-member-removed': {
    args: { orgID: UUID };
    payload: { userID: UUID };
  };
  'restart-subscription': {
    args: { userID: UUID };
    payload: null;
  };
  'customer-subscription-updated': {
    args: { customerID: UUID };
    payload: { customerID: UUID };
  };
};

export type PubSubEventName = keyof PubSubEvents;

type PubSubEventNameArguments<T extends PubSubEventName> =
  PubSubEvents[T]['args'];

type PubSubEventPayload<T extends PubSubEventName> = PubSubEvents[T]['payload'];

/**
 * An event object flowing through pubsub.
 * The pubsub channel name is composed of the event name + args.
 */
export type PubSubEvent<T extends PubSubEventName = PubSubEventName> = {
  /**
   * What happened, for example 'thread-created'.
   */
  name: T;

  /**
   * Arguments for the event name, for example the hash of the page on which a thread was created.
   */
  args: PubSubEventNameArguments<T>;

  /**
   * Details about the specific event instance, for example the id of the thread that was just created.
   */
  payload: PubSubEventPayload<T>;
};

function channelName<T extends PubSubEventName>(
  name: T,
  args: PubSubEventNameArguments<T>,
) {
  return channelNameWithLimit(jsonStableStringify({ name, args }));
}

export type PubSubAsyncIteratorArg<T extends PubSubEventName> = T extends any
  ? readonly [T, PubSubEventNameArguments<T>]
  : never;

export function pubSubAsyncIterator<T extends PubSubEventName>(
  ...events: Array<PubSubAsyncIteratorArg<T>>
) {
  events.forEach(([name]) => subscribeCounter.inc({ name }));
  return getPubSub().asyncIterator<PubSubEvent<T>>(
    events.map(([name, args]) => channelName(name, args)),
  );
}

export async function subscribeToPubSubEvent<T extends PubSubEventName>(
  name: T,
  args: PubSubEventNameArguments<T>,
  callback: (event: PubSubEvent<T>) => unknown,
) {
  subscribeCounter.inc({ name });
  return await getPubSub().subscribe(channelName(name, args), callback, {});
}

export function unsubscribeFromPubSub(subscriptionID: number) {
  getPubSub().unsubscribe(subscriptionID);
}

export function publishPubSubEvent<T extends PubSubEventName>(
  name: T,
  args: PubSubEventNameArguments<T>,
  // this type magic makes it so events that have no payload don't need to explicitly pass a null argument
  // for example user-identity
  ...payload: PubSubEventPayload<T> extends null ? [] : [PubSubEventPayload<T>]
) {
  publishCounter.inc({ name });
  const event: PubSubEvent<T> = { name, args, payload: payload[0] ?? null };
  return getPubSub().publish(channelName(name, args), event);
}

// OTHER EVENTS

export async function publishUserIdentityUpdate({
  userID,
  orgID,
  platformApplicationID,
}: {
  userID: UUID;
  orgID?: UUID;
  platformApplicationID: UUID | 'extension';
}): Promise<unknown> {
  const skipPublish = await getTypedFeatureFlagValue(
    FeatureFlags.SKIP_PUBLISH_USER_IDENTITY_UPDATE,
    {
      userID,
      orgID,
      platformApplicationID,
      version: null,
    },
  );

  // Used as an emergency measure if we see wild fan outs or odd behaviour from a
  // customer
  if (skipPublish) {
    anonymousLogger().debug(
      'Returning early from publishUserIdentityUpdate because LaunchDarkly flag is true',
      { userID, orgID, platformApplicationID },
    );
    return;
  }

  const orgIDs = orgID
    ? [orgID]
    : (
        await OrgMembersEntity.findAll({
          where: {
            userID,
          },
        })
      ).map((org) => org.orgID);
  const linkedUsers = await LinkedUsersLoader.loadConnectedUsers(
    userID,
    orgIDs,
  );

  return await Promise.all([
    publishPubSubEvent('user-identity', { userID }),
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    ...orgIDs.map((orgID) =>
      publishPubSubEvent('org-user-identity', { orgID }, { userID }),
    ),
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    ...linkedUsers.map(({ userID, orgID }) =>
      publishPubSubEvent('org-user-identity', { orgID }, { userID }),
    ),
  ]);
}

// Generic Functions

const MAX_CHANNEL_NAME_LENGTH = 1024;

// this function ensures we never go over a specific channel length limit
const channelNameWithLimit = (channel: string): string => {
  if (channel.length <= MAX_CHANNEL_NAME_LENGTH) {
    // if the channel name is already under the limit, keep as-is
    return channel;
  }

  // if above, calculate a sha1 hash of it (40 characters), append the channel name
  // for debugging and further avoiding collisions, then truncate
  const sha1 = crypto.createHash('sha1').update(channel).digest('hex');
  return `${sha1}:${channel}`.substring(0, MAX_CHANNEL_NAME_LENGTH);
};
