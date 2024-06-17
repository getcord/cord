import * as Slack from '@slack/web-api';
import { unique } from 'radash';

import env from 'server/src/config/Env.ts';
import {
  SLACK_APP_CLIENT_ID,
  SLACK_DEV_APP_CLIENT_ID,
} from 'common/const/Ids.ts';
import { slackAuthRedirectURI } from 'common/util/oauth.ts';
import type {
  ElementOf,
  ReallyRequired,
  SlackOAuthDecodeState,
} from 'common/types/index.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';

interface sendChannelMessageReturnType {
  channelID: string;
  timestamp: string;
}

export async function fetchAuthedSlackUser(
  code: string,
  isDevApp: boolean,
  decodedState: SlackOAuthDecodeState,
) {
  // At this point, we don't have an access token, so we create the client without one
  const slackClient = new Slack.WebClient();

  const redirectURI = slackAuthRedirectURI(isDevApp);

  const platformApplication = await ApplicationEntity.findByPk(
    decodedState.data.platformApplicationID,
  );

  if (!platformApplication) {
    throw new Error('Linking error - unable to find platform app');
  }

  // Returns a complete set of custom app details or null
  const customAppDetails = platformApplication.getCustomSlackAppDetails();

  const clientId =
    customAppDetails?.clientID ??
    (isDevApp ? SLACK_DEV_APP_CLIENT_ID : SLACK_APP_CLIENT_ID);

  const clientSecret =
    customAppDetails?.clientSecret ??
    (isDevApp ? env.SLACK_DEV_APP_CLIENT_SECRET : env.SLACK_APP_CLIENT_SECRET);

  const response = await slackClient.oauth.v2.access({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectURI,
  });

  if (!response.ok) {
    let msg = 'Slack OAuth Failure';
    if (response.error) {
      msg += ': ' + response.error;
    }
    // TODO: Redirect to the auth app with an error
    throw new Error(msg);
  }

  return response;
}

export interface SlackUser {
  id: string;
  team_id: string;
  name: string;
  deleted: boolean;
  real_name: string;
  is_bot: boolean;
  profile: {
    email: string;
    title: string;
    real_name: string;
    display_name: string;
    first_name: string;
    last_name: string;
    team: string;
    // most Slack profiles have an `image_original` field, but some don't.
    image_original?: string;
    // there are other fields of smaller image sizes here that we could use:
    // image_24, 32, 48, 72, 192, 512, 1024
    image_1024?: string;
    image_512?: string;
    image_192?: string;
    image_72?: string;
    image_48?: string;
    image_32?: string;
    image_24?: string;
  };
}

interface SlackUserInfoResponse extends Slack.WebAPICallResult {
  user: SlackUser;
}

export async function fetchSlackUserInfo(
  id: string,
  accessToken: string,
): Promise<SlackUserInfoResponse> {
  const slackClient = new Slack.WebClient(accessToken);
  const response = await slackClient.users.info({ user: id });
  return response as SlackUserInfoResponse;
}

interface SlackUsersListResponse extends Slack.WebAPICallResult {
  members: SlackUser[];
}

export async function fetchSlackUsersList(
  accessToken: string,
): Promise<SlackUser[]> {
  let users: SlackUser[] = [];
  const slackClient = new Slack.WebClient(accessToken);

  let cursor = undefined;
  do {
    const response = (await slackClient.users.list({
      cursor,
      limit: 500,
    })) as SlackUsersListResponse;

    users = [...users, ...response.members];

    cursor = response.response_metadata?.next_cursor;
  } while (cursor !== undefined && cursor !== ''); // ffs slack

  return users;
}

export interface SlackTeam {
  id: string;
  name: string;
  domain: string;
  email_domain: string;
  icon: {
    // there are other fields of smaller image sizes here that we could use:
    // image_34, 44, 68, 88, 102, 132, 230
    image_original: string;
  };
}

interface SlackTeamInfoResponse extends Slack.WebAPICallResult {
  team: SlackTeam;
}

export async function fetchSlackTeamInfo(
  accessToken: string,
): Promise<SlackTeamInfoResponse> {
  const slackClient = new Slack.WebClient(accessToken);
  const response = await slackClient.team.info();
  return response as SlackTeamInfoResponse;
}

export async function sendPrivateMessage(
  accessToken: string,
  recipientUserID: string,
  notificationText: string,
  messageBlocks: Slack.KnownBlock[],
  username: string | undefined,
  iconURL: string | undefined,
): Promise<sendChannelMessageReturnType | null> {
  if (process.env.IS_TEST) {
    return null;
  }

  const slackClient = new Slack.WebClient(accessToken);
  // https://api.slack.com/methods/conversations.open
  try {
    const conversationResponse = await slackClient.conversations.open({
      users: [recipientUserID].join(','),
      return_im: true, // This tells us if the channel is new, so we can send a NUX message.
    });

    if (!conversationResponse.ok || !conversationResponse.channel?.id) {
      console.log(conversationResponse);
      return null;
    }
    const channelId = conversationResponse.channel.id;

    // https://api.slack.com/methods/chat.postMessage
    const response = await slackClient.chat.postMessage({
      channel: channelId,
      text: notificationText, // used for notifications
      blocks: messageBlocks, // Actual body of the message
      username,
      icon_url: iconURL,
    });

    if (!response.ok) {
      console.log(response);
      return null;
    }

    return {
      channelID: response.channel as string,
      timestamp: response.ts as string,
    };
  } catch (e) {
    console.log(e);
    return null;
  }
}

interface SendChannelMessageArgs {
  slackBotCredentials: { bot_access_token: string };
  channelID: string;
  text: string;
  blocks?: Slack.KnownBlock[];
  threadTS?: string;
  username?: string;
  iconURL?: string;
}

export async function sendChannelMessage({
  slackBotCredentials,
  channelID,
  text,
  blocks,
  threadTS,
  username,
  iconURL,
}: SendChannelMessageArgs): Promise<sendChannelMessageReturnType | null> {
  const slackClient = new Slack.WebClient(slackBotCredentials.bot_access_token);
  try {
    // https://api.slack.com/methods/chat.postMessage
    const response = await slackClient.chat.postMessage({
      channel: channelID,
      thread_ts: threadTS,
      text,
      ...(blocks ? { blocks } : {}),
      username,
      icon_url: iconURL,
    });

    if (!response.ok) {
      console.log(response);
      return null;
    }

    return {
      channelID: response.channel as string,
      timestamp: response.ts as string,
    };
  } catch (e) {
    console.log(e);
    return null;
  }
}

export async function sendHelpMessage(
  accessToken: string,
  recipientUserID: string,
  text: string,
  onlyPostIfConversationEmpty = false,
) {
  const slackClient = new Slack.WebClient(accessToken);

  const conversationResponse = await slackClient.conversations.open({
    users: recipientUserID,
    return_im: true, // This tells us if the channel is new, so we can send a NUX message.
  });

  if (!conversationResponse.ok || !conversationResponse.channel?.id) {
    throw new Error('conversations.open failed');
  }

  const channelId = conversationResponse.channel.id;

  if (onlyPostIfConversationEmpty && conversationResponse.channel?.latest) {
    // There is at least one message in this conversation already.
    return;
  }

  const postMessageResponse = await slackClient.chat.postMessage({
    channel: channelId,
    text,
    blocks: [{ type: 'section', text: { type: 'mrkdwn', text } }],
  });

  if (!postMessageResponse.ok) {
    throw new Error('conversations.open failed');
  }
}

export async function addCordBotToSlackChannels(
  _context: RequestContext,
  botAccessToken: string,
  channelIDs: string[],
) {
  const slackClient = new Slack.WebClient(botAccessToken);

  return await Promise.all(
    channelIDs.map((channel) =>
      slackClient.conversations.join({ channel }).then(
        (_) => ({ success: true, channelID: channel, error: null }),
        (error) => ({ success: false, channelID: channel, error }),
      ),
    ),
  );
}

// A version of Slack.ConversationsListResponse with all the fields we care
// about required and non-nullable
type ValidSlackChannelsListResponse = {
  ok: boolean;
  channels: ReallyRequired<
    ElementOf<NonNullable<Slack.ConversationsListResponse['channels']>>
  >[];
};

export async function fetchSlackChannelList(slackClient: Slack.WebClient) {
  let cursor = undefined;
  const channels = [];

  do {
    const response: Slack.ConversationsListResponse =
      await slackClient.conversations.list({
        cursor,
        types: 'public_channel',
      });

    if (!isValidSlackChannelsListResponse(response)) {
      throw new Error(
        'Malformed Slack API response (conversations.list.channels)',
      );
    }

    if (!response.ok) {
      throw new Error('conversations.list failed');
    }

    channels.push(...response.channels);
    cursor = response.response_metadata?.next_cursor;
  } while (cursor);

  // NOTE: num_members includes apps, therefore our bot is included in that
  // number.
  // NOTE: when there are more channels than what Slack returns in a single call
  // to conversations.list, we do reperated calls using the "cursor" mechanism.
  // Apparently, we may be getting some duplicates in that case. Hence we make
  // the list unique first using `uniqBy`.
  return unique(channels, ({ id }) => id).map(
    ({ id, name, num_members, is_archived }) => ({
      id,
      name,
      users: num_members,
      archived: is_archived,
    }),
  );
}

function isValidSlackChannelsListResponse(
  resp: Slack.ConversationsListResponse,
): resp is ValidSlackChannelsListResponse & Slack.WebAPICallResult {
  return (
    resp &&
    typeof resp === 'object' &&
    Array.isArray(resp.channels) &&
    resp.channels.every(
      (x: any) =>
        typeof x.id === 'string' &&
        typeof x.name === 'string' &&
        typeof x.num_members === 'number' &&
        typeof x.is_archived === 'boolean',
    )
  );
}
