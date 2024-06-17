import dayjs from 'dayjs';
import Calendar from 'dayjs/plugin/calendar.js';
dayjs.extend(Calendar);
// eslint-disable-next-line no-restricted-imports
import type { TFunction } from 'i18next';
import type {
  ClientMessageData,
  Reaction,
  ThreadSummary,
} from '@cord-sdk/types';
import { UNDO_DELETE_MESSAGE_TIMEOUT_SECONDS } from './const/Timing.js';

/**
 * Returns a work in singular or plural form depending on given number. This includes the count, e.g.:
 * - `pluralize(0, 'hour')` -> '0 hours'
 * - `pluralize(1, 'hour')` -> '1 hour'
 * - `pluralize(2, 'hour')` -> '2 hours'
 * - `pluralize(0, 'box', 'boxes')` -> '0 boxes'
 * - `pluralize(1, 'box', 'boxes')` -> '1 box'
 */
export function pluralize(n: number, what: string, plural?: string) {
  return `${n} ${pluralizeWord(n, what, plural)}`;
}

/**
 * Returns a work in singular or plural form depending on given number. This does not include the count, e.g.:
 * - `pluralizeWord(0, 'hour')` -> 'hours'
 * - `pluralizeWord(1, 'hour')` -> 'hour'
 * - `pluralizeWord(2, 'hour')` -> 'hours'
 * - `pluralizeWord(0, 'box', 'boxes')` -> 'boxes'
 * - `pluralizeWord(1, 'box', 'boxes')` -> 'box'
 */
export function pluralizeWord(
  n: number,
  what: string,
  plural: string = what + 's',
) {
  return n === 1 ? what : plural;
}

export function logComponentInstantiation(name: string) {
  (window.CordSDK as any)?.__CORD_OPENSOURCE_COMPONENTS.add(name);
}

export function logComponentReplacement(name: string) {
  (window.CordSDK as any)?.__logV2Component(name, 'replacement');
}
export function logComponentUsage(name: string) {
  (window.CordSDK as any)?.__logV2Component(name, 'usage');
}

const TOTAL_NUM_OF_PALETTES = 8;
export function getStableColorPalette(userId: string) {
  let simpleHash = 0;
  for (const char of userId) {
    simpleHash += char.charCodeAt(0);
  }
  return (simpleHash % TOTAL_NUM_OF_PALETTES) + 1; // 1-indexed;
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

export function getFileSizeString(size: number) {
  let fileSizeString;
  if (size > 1000000) {
    // larger than a mb then we convert to MB
    fileSizeString = (size / 1000000).toFixed() + ' MB';
  } else if (size > 1000) {
    // larger than a kb then we convert to KB
    fileSizeString = (size / 1000).toFixed() + ' KB';
  } else {
    // converts to bytes
    fileSizeString = size.toString() + ' bytes';
  }
  return fileSizeString;
}

export function isUserAuthorOfMessage(
  message: ClientMessageData,
  userID: string | null | undefined,
) {
  return !userID || userID === message.authorID;
}

export function canUndoMessageDelete(date: Date, now: number): boolean {
  // Checks whether a message should have the undo button after deleting a message
  const secondsSinceDeleted = (now - date.getTime()) / 1000;
  return secondsSinceDeleted <= UNDO_DELETE_MESSAGE_TIMEOUT_SECONDS;
}

export function relativeTimestampString(
  date: Date,
  now: number,
  t: TFunction<'presence' | 'message' | 'notifications', 'timestamp'>,
) {
  const deltaSeconds = (now - date.getTime()) / 1000;
  const absoluteDeltaSeconds = Math.abs(deltaSeconds);
  const dateNow = new Date(now);
  const isFuture = deltaSeconds < 0;

  if (absoluteDeltaSeconds < 60) {
    // new messages can have a delta second of -0.X which we still want to show as just now
    if (deltaSeconds < -5) {
      return t(`in_less_than_a_minute`);
    }
    // during the last minute
    // For the MESSAGE location, "just now" appears as the end of a full sentence, so we don't want to capitalize it; for the NOTIFICATION location it appears standalone and so we do.
    return t('just_now');
  } else if (absoluteDeltaSeconds < 60 * 60) {
    const minutes = Math.floor(absoluteDeltaSeconds / 60);

    if (isFuture) {
      // in the next hour
      return t('in_minutes', { count: minutes });
    }

    // during the last hour
    return t('minutes_ago', { count: minutes });
  } else if (absoluteDeltaSeconds < 60 * 60 * 24) {
    const hours = Math.floor(absoluteDeltaSeconds / (60 * 60));

    if (isFuture) {
      // in the next 24 hours
      return t('in_hours', { count: hours });
    }
    // during the last 24 hours
    return t('hours_ago', { count: hours });
  } else {
    return dayjs(date).calendar(now, {
      lastDay: t('yesterday_format'),
      lastWeek: t('last_week_format'),
      nextDay: t('tomorrow_format'),
      nextWeek: t('next_week_format'),
      sameElse:
        date.getFullYear() === dateNow.getFullYear()
          ? t('this_year_format')
          : t('other_format'),
    });
  }
}

export function absoluteTimestampString(
  date: Date,
  now: number,
  t: TFunction<'message', 'absolute_timestamp'>,
) {
  const dateNow = new Date(now);
  return dayjs(date).calendar(now, {
    sameDay: t('today_format'),
    lastDay: t('yesterday_format'),
    lastWeek: t('last_week_format'),
    nextDay: t('tomorrow_format'),
    nextWeek: t('next_week_format'),
    sameElse:
      date.getFullYear() === dateNow.getFullYear()
        ? t('this_year_format')
        : t('other_format'),
  });
}

export function getUnseenReactions(
  thread: ThreadSummary,
  message: ClientMessageData,
  userID: string | null | undefined,
) {
  const threadParticipant = thread.participants.find(
    (p) => p.userID === userID,
  );

  return isUserAuthorOfMessage(message, userID)
    ? message.reactions.filter(
        (reaction) =>
          reaction.timestamp >
            (threadParticipant?.lastSeenTimestamp ?? Infinity) &&
          reaction.userID !== userID,
      )
    : [];
}

export function isViewerPreviouslyAddedReaction(
  userID: string,
  reactions: Reaction[],
  unicodeReaction: string,
) {
  const userReactionSet = !reactions
    ? new Set()
    : new Set(
        reactions
          .filter((reaction) => reaction.userID === userID)
          .map((reaction) => reaction.reaction),
      );

  return userReactionSet.has(unicodeReaction);
}
