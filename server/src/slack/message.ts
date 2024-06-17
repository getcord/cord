import { toHTML } from 'slack-markdown';
import { JSDOM } from 'jsdom';

import {
  createFormattedMessageTextNode,
  createMentionNode,
} from '@cord-sdk/react/common/lib/messageNode.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import type { MessageSlackMentionNode } from 'common/util/paste.ts';
import {
  cleanPastedNodes,
  deserializeElementToMessageContent,
} from 'common/util/paste.ts';
import type { MessageContent, MessageNode } from '@cord-sdk/types';
import { userDisplayName } from 'server/src/entity/user/util.ts';
import { UserLoader } from 'server/src/entity/user/UserLoader.ts';

export function structuredMessageFromSlackMessage(
  msg: any,
  viewer: Viewer,
): Promise<MessageContent> {
  const { text } = msg;
  if (typeof text === 'string') {
    return structuredMessageFromSlackMrkdwn(text, viewer);
  } else {
    return Promise.resolve([]);
  }
}

type SlackMessageNode = MessageNode | MessageSlackMentionNode;
type SlackMessageContent = SlackMessageNode[];

async function replaceSlackMentionsWithUserMentions(
  viewer: Viewer,
  messageContent: SlackMessageContent,
): Promise<MessageContent> {
  const userLoader = new UserLoader(viewer, () => null);

  const replaceInNode = async (node: SlackMessageNode) => {
    if (node.type === 'slack_mention') {
      const user = await userLoader.loadUserForSlackUserWithinViewerOrg(
        node.slackUserID,
      );

      if (user) {
        return createMentionNode(user.id, userDisplayName(user));
      } else {
        return createFormattedMessageTextNode({
          text: 'unknown user',
          italic: true,
        }); // this could happen if a user from a Slack connect org is @ mentioned
      }
    }

    if ('children' in node) {
      const children = node.children;
      const newChildren = await Promise.all(
        children.map((childNode) => replaceInNode(childNode)),
      );

      node.children = newChildren;
    }

    return node;
  };

  const messageChildNodes = await Promise.all(
    messageContent.map((childNode) => replaceInNode(childNode)),
  );

  return messageChildNodes;
}

async function structuredMessageFromSlackMrkdwn(
  mrkdwn: string,
  viewer: Viewer,
): Promise<MessageContent> {
  // Decoding the html entities slack sends us
  // Only replacing the ones outlined here https://api.slack.com/reference/surfaces/formatting#escaping
  const decodedMrkdwn = mrkdwn
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

  const html = toHTML(decodedMrkdwn);

  const dom = new JSDOM(html);

  const slackMessageContent: SlackMessageContent =
    deserializeElementToMessageContent(dom.window.document.body, false);

  const messageWithReplacedMentions =
    await replaceSlackMentionsWithUserMentions(viewer, slackMessageContent);

  const cleanNodes = cleanPastedNodes(messageWithReplacedMentions);

  return cleanNodes;
}

export function escapeForSlack(text: string) {
  // Slack wants text with precisely these three characters escaped:
  // https://api.slack.com/reference/surfaces/formatting#escaping
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
