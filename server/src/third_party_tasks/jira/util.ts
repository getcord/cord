import type {
  MessageContent,
  MessageNode,
  MessageTextNode,
} from '@cord-sdk/types';
import { MessageNodeType } from '@cord-sdk/types';
import { userDisplayName } from 'server/src/entity/user/util.ts';

const textNodeStyleToMarks = (node: MessageTextNode) => {
  const marks = [];
  if (node.bold) {
    marks.push({ type: 'strong' });
  }
  if (node.italic) {
    marks.push({ type: 'em' });
  }
  if (node.underline) {
    marks.push({ type: 'underline' });
  }
  return marks;
};

export type AtlassianDocument = {
  type: 'doc';
  version: 1;
  content: AtlassianDocumentNode[];
};

export type AtlassianDocumentNode = {
  type: string;
  text?: string;
  marks?: any[];
  content?: AtlassianDocumentNode[];
};

export const emptyFooter: AtlassianDocumentNode[] = [
  {
    type: 'text',
    text: '',
  },
];

const convertNodeListToAtlassianDocumentNodes = (
  nodes: MessageNode[],
): AtlassianDocumentNode[] => {
  const convertedNodes = nodes
    .map(convertNodeToAtlassianDocumentNode)
    .filter((node): node is AtlassianDocumentNode => node !== undefined);

  const resultNodes: AtlassianDocumentNode[] = [];

  //  merge sequential bullet/ordered lists
  for (const node of convertedNodes) {
    if (
      node.type === 'bulletList' &&
      resultNodes.length > 0 &&
      resultNodes[resultNodes.length - 1].type === 'bulletList'
    ) {
      resultNodes[resultNodes.length - 1].content = [
        ...resultNodes[resultNodes.length - 1].content!,
        ...node.content!,
      ];
    } else if (
      node.type === 'orderedList' &&
      resultNodes.length > 0 &&
      resultNodes[resultNodes.length - 1].type === 'orderedList'
    ) {
      resultNodes[resultNodes.length - 1].content = [
        ...resultNodes[resultNodes.length - 1].content!,
        ...node.content!,
      ];
    } else {
      resultNodes.push(node);
    }
  }

  return resultNodes;
};

const wrapTextInParagraphIfNecessary = (
  node: AtlassianDocumentNode,
): AtlassianDocumentNode => {
  if (node.type === 'text') {
    return {
      type: 'paragraph',
      content: [node],
    };
  } else {
    return node;
  }
};

const convertNodeToAtlassianDocumentNode = (
  node: MessageNode,
): AtlassianDocumentNode | undefined => {
  if (node.type === undefined) {
    if (!node.text) {
      return undefined;
    }

    return {
      type: 'text',
      text: node.text,
      marks: textNodeStyleToMarks(node),
    };
  } else {
    switch (node.type) {
      case MessageNodeType.LINK: {
        const nodeText = (node.children[0] as MessageTextNode).text;
        if (nodeText.length === 0) {
          return undefined;
        }
        return {
          type: 'text',
          text: nodeText,
          marks: [
            {
              type: 'link',
              attrs: { href: node.url },
            },
          ],
        };
      }
      case MessageNodeType.PARAGRAPH:
      case MessageNodeType.MARKDOWN: {
        const content = convertNodeListToAtlassianDocumentNodes(node.children);
        if (content.length === 0) {
          return undefined;
        }

        return {
          type: 'paragraph',
          content,
        };
      }
      case MessageNodeType.TODO:
      case MessageNodeType.BULLET: {
        const content = convertNodeListToAtlassianDocumentNodes(node.children);
        if (content.length === 0) {
          return undefined;
        }

        return {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: content.map(wrapTextInParagraphIfNecessary),
            },
          ],
        };
      }
      case MessageNodeType.NUMBER_BULLET: {
        const content = convertNodeListToAtlassianDocumentNodes(node.children);
        if (content.length === 0) {
          return undefined;
        }

        return {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: content.map(wrapTextInParagraphIfNecessary),
            },
          ],
        };
      }
      case MessageNodeType.ASSIGNEE:
        return {
          type: 'text',
          text: (node.children[0] as MessageTextNode).text, // TODO: strip +
        };
      case MessageNodeType.MENTION:
        return {
          type: 'text',
          text: (node.children[0] as MessageTextNode).text, // TODO: strip @
        };
      case MessageNodeType.QUOTE: {
        const content = convertNodeListToAtlassianDocumentNodes(node.children);
        if (content.length === 0) {
          return undefined;
        }

        return {
          type: 'blockquote',
          content: content.map(wrapTextInParagraphIfNecessary),
        };
      }
      case MessageNodeType.CODE: {
        const content = convertNodeListToAtlassianDocumentNodes(node.children);
        if (content.length === 0) {
          return undefined;
        }

        return {
          type: 'codeBlock',
          content: content.map(wrapTextInParagraphIfNecessary),
        };
      }
    }
  }
};

export function messageContentToAtlassianDocument(
  content: MessageContent,
  footer: AtlassianDocumentNode[],
): AtlassianDocument {
  return {
    type: 'doc',
    version: 1,
    content: convertNodeListToAtlassianDocumentNodes(content)
      .map(wrapTextInParagraphIfNecessary)
      .concat({
        type: 'paragraph',
        content: footer,
      }),
  };
}

export function unmatchedUsersToAtlassianDocument(
  users: Array<{
    name: string | null;
    screenName: string | null;
    email: string | null;
  }>,
): AtlassianDocument {
  return {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'This task was assigned to the following Cord users who did not have Jira connected:',
          },
        ],
      },

      {
        type: 'bulletList',
        content: users.map((user) => ({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: [userDisplayName(user), user.email || '']
                    .join(' ')
                    .trim(),
                },
              ],
            },
          ],
        })),
      },
    ],
  };
}
