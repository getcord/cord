import type { Node } from 'slate';
import { Element } from 'slate';
import { v4 as uuid } from 'uuid';
import { MessageNodeType } from '@cord-sdk/types';
import type {
  MessageAssigneeNode,
  MessageContent,
  MessageMentionNode,
  MessageNode,
  MessageNodeWithChildren,
  MessageStyledBlockType,
  MessageTextNode,
  MessageTodoNode,
  UUID,
} from '@cord-sdk/types';
import { trimStart, trimEnd } from './trim.js';

export const MAX_BULLET_INDENT = 4;

// '& Node' in return value stops Slate complaining when passing node to its methods
// Casting to any is because TS doesn't seem to like combining the two to make the node
export function createMessageNode<
  NodeType extends MessageNodeType,
  NodeAttributes extends MessageNode<NodeType> = MessageNode<NodeType>,
>(
  nodeType: NodeType,
  nodeAttributes: Omit<NodeAttributes, 'type'>,
): MessageNode<NodeType> & Node {
  return {
    type: nodeType,
    ...nodeAttributes,
  } as any;
}

export function createMessageTextNode(text: string): MessageTextNode {
  return {
    text,
  };
}

export function createFormattedMessageTextNode(input: {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
}): MessageTextNode {
  return input;
}

export function isMessageNodeType<NodeType extends MessageNodeType>(
  node: Node | undefined,
  nodeType: NodeType,
): node is MessageNode<NodeType> {
  return Boolean(node && Element.isElement(node) && node.type === nodeType);
}

export function isMessageNodeText(node: MessageNode): node is MessageTextNode {
  return !node.type && 'text' in node;
}

export function createParagraphNode(text = '') {
  return createMessageNode(MessageNodeType.PARAGRAPH, {
    children: [{ text }],
  });
}

export function createMentionNode(userID: UUID, name: string) {
  return createMessageNode(MessageNodeType.MENTION, {
    user: { id: userID },
    children: [{ text: `@${name}` }],
  });
}

export function createAssigneeNode(userID: UUID, name: string) {
  return createMessageNode(MessageNodeType.ASSIGNEE, {
    user: { id: userID },
    children: [{ text: `+${name}` }],
  });
}

export function createLinkNode(url: string, text: string) {
  return createMessageNode(MessageNodeType.LINK, {
    url,
    children: [{ text }],
  });
}

export function messageContentFromString(text: string): MessageContent {
  return [createParagraphNode(text)];
}

function getInitialStyledBlockProps(
  blockType: MessageStyledBlockType,
  indent?: number,
) {
  if (blockType === MessageNodeType.TODO) {
    return {
      done: false,
      todoID: uuid(),
    };
  } else if (
    blockType === MessageNodeType.BULLET ||
    blockType === MessageNodeType.NUMBER_BULLET
  ) {
    return {
      indent,
    };
  } else {
    return {};
  }
}

export function createStyledBlockNode(
  blockType: MessageStyledBlockType,
  text: string,
  indent?: number,
) {
  return createMessageNode(blockType, {
    children: messageContentFromString(text),
    ...getInitialStyledBlockProps(blockType, indent),
  });
}

const findTodoNodesInSubtree = (
  parent: MessageNode,
  accumulator: MessageTodoNode[],
): void => {
  if (parent.type === MessageNodeType.TODO) {
    accumulator.push(parent);
  } else {
    const children = getMessageNodeChildren(parent);
    if (children) {
      for (const node of children) {
        findTodoNodesInSubtree(node, accumulator);
      }
    }
  }
};

export const todoNodesFromMessage = (messageContent: MessageContent) => {
  const accumulator: MessageTodoNode[] = [];

  for (const node of messageContent) {
    findTodoNodesInSubtree(node, accumulator);
  }

  return accumulator;
};

export function getMessageNodeChildren(node: MessageNode) {
  return (node as MessageNodeWithChildren).children;
}

export const textFromNodeRecursive = (node: MessageNode): string => {
  let textArr: Array<string> = [];

  if (isMessageNodeText(node)) {
    return node.text;
  }

  const children = getMessageNodeChildren(node);
  if (children) {
    textArr = textArr.concat(
      children.map((child) => textFromNodeRecursive(child)),
    );
  }

  const result = textArr.join('');

  return result;
};

export function convertStructuredMessageToText(
  messageContent: MessageContent,
): string {
  return messageContent
    .map((node) => textFromNodeRecursive(node))
    .join('\n')
    .trim();
}

// converts a list of MessageNode into text.
// any whitespace or assignees at the start/end are removed.
function taskTitleFromMessageNodes(
  nodes: (MessageTextNode | MessageAssigneeNode | MessageMentionNode)[],
): string {
  let pending = '';
  let text = '';

  for (const node of nodes) {
    if (node.type === MessageNodeType.ASSIGNEE) {
      if (text.trim() === '') {
        // no text was seen so far, so this is an assignee at the start of a
        // message. We want to skip those.
        continue;
      }
      // okay, we have seen some text already, but this assignee might be at
      // the very end of the message. Hence let the assignee wait in the
      // pending until we find non-empty text (which would mean the assignee is
      // not at the end of the message)
      pending += trimStart(textFromNodeRecursive(node), '+');
      continue;
    }

    let newText = '';
    if (isMessageNodeText(node)) {
      newText = node.text;
    } else if (node.type === MessageNodeType.MENTION) {
      newText = trimStart(textFromNodeRecursive(node), '@');
    }

    const isEmpty = newText.trim() === '';
    if (isEmpty) {
      // this might be either trailing whitespace or whitespace in the middle
      // of the message. For now, let's have it in pending until something
      // non-empty arrives
      pending += newText;
    } else {
      // we found some non-empty text so whatever was waiting in the pending
      // can now finally become part of text
      text += pending + newText;
      pending = '';
    }
  }

  return trimEnd(text.trim(), ':').trim();
}

// converts each MessageNode into text, returns the first non-empty one.
export function taskTitleFromMessageContent(
  messageContent: MessageContent,
): string {
  for (let i = 0; i < messageContent.length; i++) {
    const nodes: (
      | MessageTextNode
      | MessageAssigneeNode
      | MessageMentionNode
    )[] = [];
    flattenMessage(messageContent[i], nodes);

    const title = taskTitleFromMessageNodes(nodes);
    if (title.length > 0) {
      return title;
    }
  }

  return 'Task created using Cord';
}

function flattenMessage(
  node: MessageNode,
  accumulator: (MessageTextNode | MessageAssigneeNode | MessageMentionNode)[],
) {
  if (
    isMessageNodeText(node) ||
    node.type === MessageNodeType.ASSIGNEE ||
    node.type === MessageNodeType.MENTION
  ) {
    accumulator.push(node);
    return;
  }
  const children = getMessageNodeChildren(node);
  if (!children) {
    return;
  }

  for (const child of children) {
    flattenMessage(child, accumulator);
  }
}

// message.content is null if message is deleted
export const findMessageNode = (
  arr: MessageContent | null,
  nodeType: MessageNodeType,
): any => {
  if (!arr) {
    return null;
  }
  for (const item of arr) {
    if (item.type === nodeType) {
      return item;
    }
    if ('children' in item) {
      const p = findMessageNode(item.children, nodeType);
      if (p) {
        return p;
      }
    }
  }

  return null;
};
