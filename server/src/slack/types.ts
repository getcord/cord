import type { JsonValue } from 'common/types/index.ts';

export type SlackBotUserAuthData = {
  bot_user_id: string;
  bot_access_token: string;
};

export function asSlackBotUserAuthData(
  x: JsonValue,
): SlackBotUserAuthData | null {
  if (
    x &&
    typeof x === 'object' &&
    !Array.isArray(x) &&
    typeof x.bot_user_id === 'string' &&
    typeof x.bot_access_token === 'string'
  ) {
    return {
      bot_user_id: x.bot_user_id,
      bot_access_token: x.bot_access_token,
    };
  }
  return null;
}

// Annoyingly, Slack uses different sets of string constants to denote channel
// types in different API methods.  Some API methods use single characters
// ('C', 'G',...) in their response, others use lowercase words ('channel',
// 'im',...). And then other methods use a different set of snake_case words
// ('public_channel', 'private_channel'). And then, some responses may not have
// a single channel type field, but rather a bunch of boolean fields
// ('is_channel', 'is_group',...).
export enum SlackChannelType {
  PUBLIC = 'C',
  PRIVATE = 'G',
}

export enum SlackMessageChannelType {
  PUBLIC = 'channel',
  IM = 'im',
}

export type ChannelArchiveEvent = {
  // Confusingly, this is the channel ID
  channel: string;
  user: string;
};

export type ChannelUnarchiveEvent = ChannelArchiveEvent;
