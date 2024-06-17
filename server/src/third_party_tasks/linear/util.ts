import type {
  MessageContent,
  MessageNode,
  MessageTextNode,
} from '@cord-sdk/types';
import { MessageNodeType } from '@cord-sdk/types';
import { splitStringToWsAndText } from 'server/src/util/splitStringToWsAndText.ts';

const textNodeToMarkdown = (node: MessageTextNode): string => {
  let wrapper = '';

  const [wsStart, middleText, wsEnd] = splitStringToWsAndText(node.text);

  if (node.bold) {
    wrapper += '**';
  }

  if (node.italic) {
    wrapper += '*';
  }

  if (node.underline) {
    // Markdown does not support underline
  }

  if (!middleText) {
    return '';
  }

  return wsStart + wrapper + middleText + wrapper + wsEnd;
};

const convertNodeToMarkdown = (node: MessageNode): string => {
  if (node.type === undefined) {
    return textNodeToMarkdown(node);
  } else {
    switch (node.type) {
      case MessageNodeType.LINK: {
        const nodeText = (node.children[0] as MessageTextNode).text;
        return `[${escapeLinkTextAndURL(nodeText)}](${escapeLinkTextAndURL(
          node.url,
        )})`;
      }
      case MessageNodeType.PARAGRAPH:
        return `${convertNodeListToMarkdown(node.children)}\n\n`;
      case MessageNodeType.TODO:
        return `* [ ] ${convertNodeListToMarkdown(node.children)}\n`;
      case MessageNodeType.BULLET:
        return `* ${convertNodeListToMarkdown(node.children)}\n`;
      case MessageNodeType.NUMBER_BULLET:
        return `1. ${convertNodeListToMarkdown(node.children)}\n`;
      case MessageNodeType.ASSIGNEE:
      case MessageNodeType.MENTION:
        return (node.children[0] as MessageTextNode).text;
      case MessageNodeType.QUOTE:
        return `> ${convertNodeListToMarkdown(node.children)}\n\n`;
      case MessageNodeType.CODE:
        return `\`${convertNodeListToMarkdown(node.children)}\``;
      case MessageNodeType.MARKDOWN:
        // TODO: MARKDOWN_NODE be careful with how we are "supporting" markdown spec here
        return `\`${convertNodeListToMarkdown(node.children)}\``;
    }
  }
};

const convertNodeListToMarkdown = (nodes: MessageNode[]) => {
  const test = nodes
    ? nodes.map((node) => convertNodeToMarkdown(node)).join('')
    : null;
  return test;
};

export const convertMessageContentToMarkdown = (
  messageContent: MessageContent,
  footer: string,
): string => {
  return (
    messageContent.map((node) => convertNodeToMarkdown(node)).join('') +
    '\n\n' +
    footer
  );
};

const escapeLinkTextAndURL = (text: string) => {
  return text.replace(/([()[\]])/g, '\\$1');
};
