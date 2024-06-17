import { unique } from 'radash';
import { isNotNull } from 'common/util/index.ts';
import type { SpecificNotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import type {
  Notification,
  NotificationHeaderNode,
  NotificationSender,
} from 'server/src/schema/resolverTypes.ts';
import type { SimpleTranslationParameters } from 'common/types/index.ts';

export async function buildReactionNotification(
  context: RequestContext,
  notifs: SpecificNotificationEntity<'reaction'>[],
): Promise<Notification | null> {
  const firstNotif = notifs[0];
  const firstNotifReaction = firstNotif.reactionID;

  if (firstNotifReaction === null) {
    throw new Error('Reaction notif must have reactionID');
  }

  notifs.forEach((notification) => {
    if (!notification.senderID) {
      throw new Error(`Reaction notif must have a sender`);
    }
  });

  const [maybeSenders, message, reactionUnicode] = await Promise.all([
    Promise.all(
      notifs.map((n) => context.loaders.userLoader.loadUser(n.senderID!)),
    ),
    (async () => {
      const reaction =
        await context.loaders.messageReactionLoader.loadReactionNoOrgCheck(
          firstNotifReaction,
        );
      if (!reaction) {
        return null;
      }
      return await context.loaders.messageLoader.loadMessage(
        reaction.messageID,
      );
    })(),
    (async () => {
      // TODO (notifications) revisit with smarter logic designs once options
      // have been explored.
      // Displaying aggregated reaction notifications will only show the most
      // recent reaction unicode from the group.
      const reaction =
        await context.loaders.messageReactionLoader.loadReactionNoOrgCheck(
          firstNotifReaction,
        );

      return reaction?.unicodeReaction ?? null;
    })(),
  ]);

  if (message === null) {
    throw new Error('Unable to load message');
  }

  if (reactionUnicode === null) {
    throw new Error('Unable to load message reaction');
  }

  // If the underlying message has been deleted, don't return a notification
  if (message.deletedTimestamp) {
    return null;
  }

  const senders = unique(maybeSenders.filter(isNotNull), (u) => u.id);
  if (senders.length === 0) {
    throw new Error('Unable to load any senders');
  }

  await context.loaders.threadLoader.assertViewerHasThread(message.threadID);

  const [header, headerTranslationKey, headerSimpleTranslationParams] =
    getHeader(senders, reactionUnicode);

  return {
    id: firstNotif.id,
    externalID: firstNotif.externalID,
    senders,
    iconUrl: null,
    header,
    headerTranslationKey,
    headerSimpleTranslationParams,
    attachment: {
      message,
    },
    readStatus: firstNotif.readStatus,
    timestamp: firstNotif.createdTimestamp,
    extraClassnames: firstNotif.extraClassnames,
    metadata: firstNotif.metadata,
  };
}

function getHeader(
  senders: NotificationSender[],
  reactionUnicode: string,
): [NotificationHeaderNode[], string, SimpleTranslationParameters] {
  // Three cases, depending on how many people reacted:
  // - One person: NAME reacted to your message
  // - Two people: NAME and NAME reacted to your message
  // - Three+ people: NAME and N others reacted to your message

  if (senders.length === 0) {
    // This should be verified by the creation function above...
    throw new Error('Notification must have at least one sender!');
  } else if (senders.length === 1) {
    return [
      [
        {
          user: senders[0],
        },
        {
          text: ` reacted ${reactionUnicode} to your message`,
          bold: false,
        },
      ],
      'cord.reaction_single',
      { reaction: reactionUnicode },
    ];
  } else if (senders.length === 2) {
    return [
      [
        {
          user: senders[0],
        },
        {
          text: ' and ',
          bold: true,
        },
        {
          user: senders[1],
        },
        {
          text: ` reacted ${reactionUnicode} to your message`,
          bold: false,
        },
      ],
      'cord.reaction_double',
      { reaction: reactionUnicode },
    ];
  } else {
    return [
      [
        {
          user: senders[0],
        },
        {
          text: ` and ${senders.length - 1} others`,
          bold: true,
        },
        {
          text: ` reacted ${reactionUnicode} to your message`,
          bold: false,
        },
      ],
      'cord.reaction_overflow',
      { reaction: reactionUnicode, count: senders.length - 1 },
    ];
  }
}
