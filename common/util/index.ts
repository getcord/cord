import md5 from 'blueimp-md5';
import jsonStableStringify from 'fast-json-stable-stringify';
import { unique } from 'radash';
import shajs from 'sha.js';
import dayjs from 'dayjs';
import Calendar from 'dayjs/plugin/calendar.js';
import isBetween from 'dayjs/plugin/isBetween.js';

import type {
  UUID,
  MessageContent,
  ReferencedUserData,
} from 'common/types/index.ts';
import { MessageNodeType } from 'common/types/index.ts';
import {
  CORD_PLATFORM_ORG_ID,
  CORD_ADMIN_PLATFORM_ORG_ID,
  GILLIAN_TEST_SLACK_ORG_ID,
  RADICAL_ORG_ID,
  RADICAL_TEST_ORG_ID,
  KAT_TEST_SLACK_ORG_ID,
  CORD_SLACK_TEAM_ID,
  CORD_TEST_SLACK_TEAM_ID,
} from 'common/const/Ids.ts';
import {
  getMessageNodeChildren,
  textFromNodeRecursive,
} from '@cord-sdk/react/common/lib/messageNode.ts';
import { trimStart } from '@cord-sdk/react/common/lib/trim.ts';

const uuidRegex =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const isEmployee = (orgID: UUID | undefined) =>
  orgID === RADICAL_ORG_ID ||
  orgID === RADICAL_TEST_ORG_ID ||
  orgID === CORD_PLATFORM_ORG_ID ||
  orgID === GILLIAN_TEST_SLACK_ORG_ID ||
  orgID === KAT_TEST_SLACK_ORG_ID ||
  orgID === CORD_ADMIN_PLATFORM_ORG_ID ||
  process.env.NODE_ENV === 'development';

export const isInternalSlackOrg = (slackTeamID: string | undefined) =>
  slackTeamID === CORD_SLACK_TEAM_ID || slackTeamID === CORD_TEST_SLACK_TEAM_ID;

export const assertUUID = (value: string): UUID => {
  if (!uuidRegex.test(value)) {
    throw new Error(`Invalid UUID ${value}`);
  } else {
    return value;
  }
};

/**
 * @deprecated MD5 is no longer secure, use sha256Hash instead.
 */
export function md5Hash(object: boolean | number | string | object) {
  return md5(jsonStableStringify(object));
}

export function sha256Hash(value: string) {
  return shajs('sha256').update(value).digest('hex');
}
export const SHA256_HASH_LENGTH = 64;

export function generateSalt() {
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function sha256HashAndSalt(
  value: string,
  salt: string = generateSalt(),
) {
  return 'sha256' + ':' + salt + ':' + sha256Hash(salt + ':' + value);
}

export function prepareTextContent(textContent: string) {
  return (
    textContent
      .trim()
      .toLowerCase()
      // Remove Zero Width No-Break Space (U+FEFF)
      .replace(/[\uFEFF\n]/gm, '')
  );
}

export function doesTextQualify(text: string | undefined | null) {
  return Boolean(text && text.length > 1 && text.trim());
}

export function getSha256Salt(hash: string): string {
  return hash?.split(':')[1] ?? '';
}

export function matchesHash(value: string, hashWithSalt: string) {
  return hashWithSalt === sha256HashAndSalt(value, getSha256Salt(hashWithSalt));
}

export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function getMentionedUserIDs(content: MessageContent): UUID[] {
  let users: UUID[] = [];
  for (const node of content) {
    if (node.type === MessageNodeType.MENTION) {
      users.push(node.user.id);
    } else {
      const children = getMessageNodeChildren(node);
      if (children) {
        users = [...users, ...getMentionedUserIDs(children)];
      }
    }
  }

  return unique(users);
}

export function getReferencedUserIDs(content: MessageContent): UUID[] {
  const accumulator = new Set<UUID>();
  gatherReferencedUserIDs(content, accumulator);
  return [...accumulator];
}

function gatherReferencedUserIDs(
  nodes: MessageContent,
  accumulator: Set<UUID>,
) {
  for (const node of nodes) {
    if (
      node.type === MessageNodeType.MENTION ||
      node.type === MessageNodeType.ASSIGNEE
    ) {
      accumulator.add(node.user.id);
      continue;
    }
    const children = getMessageNodeChildren(node);
    if (children) {
      gatherReferencedUserIDs(children, accumulator);
    }
  }
}

export function getReferencedUserIDsAndNames(
  content: MessageContent,
): ReferencedUserData[] {
  const accumulator = new Map<UUID, string>();
  gatherReferencedUserIDsAndName(content, accumulator);
  return [...accumulator].map(([id, name]) => ({ id, name }));
}

function gatherReferencedUserIDsAndName(
  nodes: MessageContent,
  accumulator: Map<UUID, string>,
) {
  for (const node of nodes) {
    if (
      node.type === MessageNodeType.MENTION ||
      node.type === MessageNodeType.ASSIGNEE
    ) {
      const userID = node.user.id;
      const name = trimStart(textFromNodeRecursive(node), '@');
      accumulator.set(userID, name);
      continue;
    }
    const children = getMessageNodeChildren(node);
    if (children) {
      gatherReferencedUserIDsAndName(children, accumulator);
    }
  }
}

// JS replaceAll not well supported yet: https://caniuse.com/?search=replaceAll
export function replaceAll(str: string, replace: string, replaceWith: string) {
  return str.split(replace).join(replaceWith);
}

export type UserWithNames = {
  displayName: string;
  fullName: string;
};

export type DisplayableUser = UserWithNames & {
  id: UUID;
  profilePictureURL: string | null;
};

export function assert(predicate: boolean, message: string): asserts predicate {
  if (!predicate) {
    throw new Error(message);
  }
}

/**
 * Returns the supplied items using the specified combiner.
 *
 * @example
 * // Returns "foo, bar, or baz"
 * combine("or", ["foo", "bar", "baz"])
 */
export function combine(combiner: string, items: string[]): string {
  if (items.length === 0) {
    return '';
  } else if (items.length === 1) {
    return items[0];
  } else if (items.length === 2) {
    return `${items[0]} ${combiner} ${items[1]}`;
  } else {
    return `${items.slice(0, -1).join(', ')}, ${combiner} ${
      items[items.length - 1]
    }`;
  }
}

export const CORD_DEEP_LINK_THREAD_QUERY_PARAM = 'cord_thread';
export const CORD_DEEP_LINK_MESSAGE_QUERY_PARAM = 'cord_message';
export const CORD_DEEP_LINK_QUERY_PARAM = 'cord_link';

export const CORD_ARGS_TO_REMOVE = [
  // delete deeplinking query params from urls. We dont want them as part of
  // the pageContext

  // old deeplinking query params. Keep here to support old deeplinks.
  CORD_DEEP_LINK_THREAD_QUERY_PARAM,
  CORD_DEEP_LINK_MESSAGE_QUERY_PARAM,

  // new (unified) deeplinking query param
  CORD_DEEP_LINK_QUERY_PARAM,
];

export function extractDeepLinkQueryParams(
  url: string,
): { threadID: UUID; messageID: UUID } | null {
  try {
    const parsed = new URL(url);
    return extractDeepLinkQueryParamsV1(parsed);
  } catch (e) {
    return null;
  }
}

// also see injectDeeplinkQueryParamsV1()
function extractDeepLinkQueryParamsV1(
  url: URL,
): { threadID: UUID; messageID: UUID } | null {
  const [version, threadID, messageID]: (string | undefined)[] = (
    url.searchParams.get(CORD_DEEP_LINK_QUERY_PARAM) ?? ''
  ).split('_');

  if (version !== 'v1' || !threadID || !messageID) {
    return null;
  }

  return {
    threadID,
    messageID,
  };
}

dayjs.extend(Calendar);
dayjs.extend(isBetween);

function getNowTimestamp() {
  return dayjs(new Date(Date.now()));
}

export function isTimestampTodayOrInTheFuture(timestamp: string) {
  const now = getNowTimestamp();
  return (
    dayjs(timestamp).isSame(dayjs(now), 'day') ||
    dayjs(timestamp).isAfter(dayjs(now), 'day')
  );
}

export function isTimestampFromPastSevenDays(timestamp: string) {
  const now = getNowTimestamp();
  const sevenDaysBefore = now.subtract(7, 'day');

  return (
    dayjs(timestamp).isBetween(now, sevenDaysBefore, 'day') ||
    dayjs(timestamp).isSame(sevenDaysBefore, 'date')
  );
}

export function isTimestampFromPastThirtyDays(timestamp: string) {
  const now = getNowTimestamp();
  const thirtyDaysBefore = now.subtract(30, 'day');

  return (
    dayjs(timestamp).isBetween(now, thirtyDaysBefore) ||
    dayjs(timestamp).isSame(thirtyDaysBefore, 'date')
  );
}

export function isTimestampFromPastThreeMonths(timestamp: string) {
  const now = getNowTimestamp();
  const threeMonthsBefore = now.subtract(3, 'month');
  return (
    dayjs(timestamp).isBetween(now, threeMonthsBefore) ||
    dayjs(timestamp).isSame(threeMonthsBefore, 'day')
  );
}

export function isTimestampFromPastYear(timestamp: string) {
  const now = getNowTimestamp();
  const pastYear = now.subtract(1, 'year');
  return (
    dayjs(timestamp).isBetween(now, pastYear) ||
    dayjs(timestamp).isSame(pastYear, 'day')
  );
}

export function isTimestampMoreThanAYearAgo(timestamp: string) {
  const now = getNowTimestamp();
  const pastYear = now.subtract(1, 'year');
  return dayjs(timestamp).isBefore(pastYear, 'day');
}

export function createDefaultSenderEmailName(applicationName: string) {
  return applicationName.toLowerCase().split(/\W/).join('') + '-notifications';
}

/**
 * in both the console UI and the API we don't allow editing the whole sender
 * field on customEmailTemplate, but only specific parts of it. This function
 * takes a 'sender' input and returns parts of the email.
 *
 * @example
 * const input = 'Cord <hello@cord.com>';
 * getEmailInfoFromSenderData(input); // {emailAddress: "hello@cord.com", domain: "cord.com", username: "hello" }
 */
type SenderInfo = {
  domain: string;
  emailAddress: string;
  username: string;
};
export function getEmailInfoFromSenderData(
  sender?: string,
): SenderInfo | undefined {
  if (!sender) {
    return undefined;
  }

  const mentionMatchingPattern = new RegExp(
    '(<)' + // first match a "<"
      '([^@]+)' + // then match anything that's not an @ symbol and is at least 1 char
      '(@)' + // then match the @ so we can just access the domain itself easily
      '([^>]+)', // then match anything that's not an > symbol and is at least 1 char
    'gm',
  );

  let info: SenderInfo | undefined = undefined;
  let match: RegExpExecArray | null;

  while ((match = mentionMatchingPattern.exec(sender))) {
    info = {
      username: match[2],
      domain: match[4],
      emailAddress: match[0].substring(1),
    };
  }

  return info;
}

export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
