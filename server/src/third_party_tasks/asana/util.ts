import { encode } from 'html-entities';
import type {
  MessageContent,
  MessageNode,
  MessageTextNode,
} from '@cord-sdk/types';
import { MessageNodeType } from '@cord-sdk/types';

function textNodeToHtml(node: MessageTextNode): string {
  let before = '';
  let after = '';
  if (node.bold) {
    before += '<strong>';
    after += '</strong>';
  }
  if (node.italic) {
    before = '<em>' + before;
    after += '</em>';
  }
  if (node.underline) {
    before = '<u>' + before;
    after += '</u>';
  }
  return before + encode(node.text) + after;
}

// for a list of supported html tags see:
// https://developers.asana.com/docs/reading-rich-text
function convertNodeToAsanaHtml(node: MessageNode): string {
  if (node.type === undefined) {
    return textNodeToHtml(node);
  } else {
    switch (node.type) {
      case MessageNodeType.LINK:
        return `<a href="${encodeURI(node.url)}">${encode(
          (node.children[0] as MessageTextNode).text,
        )}</a>`;
      case MessageNodeType.PARAGRAPH:
        // Asana does not support <p>
        return `${convertNodeListToAsanaHtml(node.children)}\n`;
      case MessageNodeType.TODO:
      case MessageNodeType.BULLET:
      case MessageNodeType.NUMBER_BULLET:
        return `<li>${convertNodeListToAsanaHtml(node.children)}</li>`;
      case MessageNodeType.ASSIGNEE:
      case MessageNodeType.MENTION:
        return encode((node.children[0] as MessageTextNode).text);
      case MessageNodeType.QUOTE:
        // Asana does not support <blockquote> tag
        return `${convertNodeListToAsanaHtml(node.children)}\n`;
      case MessageNodeType.CODE:
        return `<code>${convertNodeListToAsanaHtml(node.children)}</code>`;
      case MessageNodeType.MARKDOWN:
        // TODO: MARKDOWN_NODE strip markdown to plaintext or generate html?
        return convertNodeListToAsanaHtml(node.children);
    }
  }
}

function convertNodeListToAsanaHtml(nodes: MessageNode[]) {
  let html = '';
  let unorderedListStarted = false;
  let orderedListStarted = false;

  // convert all nodes to html, but wrap consecutive sequences of <li> items
  // with <ol></ol> or <ul></ul>
  for (const node of nodes) {
    const nodeHtml = convertNodeToAsanaHtml(node);

    const isOrderedItem = node.type === MessageNodeType.NUMBER_BULLET;
    const isUnorderedItem =
      node.type === MessageNodeType.BULLET ||
      node.type === MessageNodeType.TODO;

    // end of ordered list
    if (!isOrderedItem && orderedListStarted) {
      orderedListStarted = false;
      html += '</ol>';
    }
    // end of unorderedList
    if (!isUnorderedItem && unorderedListStarted) {
      unorderedListStarted = false;
      html += '</ul>';
    }

    // start of ordered list
    if (isOrderedItem && !orderedListStarted) {
      orderedListStarted = true;
      html += '<ol>';
    }
    // start of unorderedList
    if (isUnorderedItem && !unorderedListStarted) {
      unorderedListStarted = true;
      html += '<ul>';
    }

    html += nodeHtml;
  }

  if (unorderedListStarted) {
    html += '</ul>';
  }
  if (orderedListStarted) {
    html += '</ol>';
  }
  return html;
}

export function messageContentToMondayHtml(
  content: MessageContent,
  footer: string,
): string {
  return `${convertNodeListToAsanaHtml(content)}\n${footer}`;
}

export function messageContentToAsanaHtml(
  content: MessageContent,
  footer: string,
): string {
  return `<body>${convertNodeListToAsanaHtml(content)}\n${footer}</body>`;
}
