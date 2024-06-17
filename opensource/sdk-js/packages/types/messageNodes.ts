import type { UUID } from './core.js';

export enum MessageNodeType {
  ASSIGNEE = 'assignee',
  BULLET = 'bullet',
  CODE = 'code',
  LINK = 'link',
  MENTION = 'mention',
  NUMBER_BULLET = 'number_bullet',
  PARAGRAPH = 'p',
  QUOTE = 'quote',
  TODO = 'todo',
  MARKDOWN = 'markdown',
}

export type MessageContent = MessageNode[];

type MessageAnyNode =
  | MessageAssigneeNode
  | MessageBulletNode
  | MessageCodeNode
  | MessageLinkNode
  | MessageMentionNode
  | MessageNumberBulletNode
  | MessageParagraphNode
  | MessageQuoteNode
  | MessageTextNode
  | MessageTodoNode
  | MessageMarkdownNode;

export type MessageNode<N extends MessageNodeType | undefined | null = null> =
  N extends null
    ? MessageAnyNode
    : N extends undefined
    ? MessageTextNode
    : N extends MessageNodeType.ASSIGNEE
    ? MessageAssigneeNode
    : N extends MessageNodeType.BULLET
    ? MessageBulletNode
    : N extends MessageNodeType.CODE
    ? MessageCodeNode
    : N extends MessageNodeType.LINK
    ? MessageLinkNode
    : N extends MessageNodeType.MENTION
    ? MessageMentionNode
    : N extends MessageNodeType.NUMBER_BULLET
    ? MessageNumberBulletNode
    : N extends MessageNodeType.PARAGRAPH
    ? MessageParagraphNode
    : N extends MessageNodeType.QUOTE
    ? MessageQuoteNode
    : N extends MessageNodeType.TODO
    ? MessageTodoNode
    : N extends MessageNodeType.MARKDOWN
    ? MessageMarkdownNode
    : MessageAnyNode;

export type MessageNodeBase = {
  type?: MessageNodeType;
  class?: string;
};
export type MessageNodeWithChildren = MessageNodeBase & {
  children: MessageContent;
};

export type MessageBulletNode = MessageNodeWithChildren & {
  type: MessageNodeType.BULLET;
  indent?: number;
};

export type MessageCodeNode = MessageNodeWithChildren & {
  type: MessageNodeType.CODE;
};

export type MessageLinkNode = MessageNodeWithChildren & {
  type: MessageNodeType.LINK;
  url: string;
};

export type MessageMentionNode = MessageNodeWithChildren & {
  type: MessageNodeType.MENTION;
  // defining it this way instead of userID directly to maintain compatibility with
  // previous messages where we would store the entire User object
  user: { id: UUID };
};

export type MessageAssigneeNode = MessageNodeWithChildren & {
  type: MessageNodeType.ASSIGNEE;
  // defined this way to match MessageMentionNode
  user: { id: UUID };
};

export type MessageNumberBulletNode = MessageNodeWithChildren & {
  type: MessageNodeType.NUMBER_BULLET;
  bulletNumber: number;
  indent?: number;
};

export type MessageParagraphNode = MessageNodeWithChildren & {
  type: MessageNodeType.PARAGRAPH;
};

export type MessageQuoteNode = MessageNodeWithChildren & {
  type: MessageNodeType.QUOTE;
};

export const MARKS = ['bold', 'italic', 'underline', 'code'] as const;
export type Mark = (typeof MARKS)[number];

export type MessageTextNode = MessageNodeBase & {
  type?: undefined;
  text: string;
} & {
  [mark in Mark]?: boolean;
};

export type MessageTodoNode = MessageNodeWithChildren & {
  type: MessageNodeType.TODO;
  todoID: UUID;
  done: boolean;
};

export type MessageMarkdownNode = MessageNodeWithChildren & {
  type: MessageNodeType.MARKDOWN;
  // NB: validateMessageContent is far more restrictive here, allowing only a
  // single child, and requiring that child to be a text node. That's
  // expressible here in TS, but it makes a lot of the content mapping functions
  // super painful to work with, so we don't.
};

export type MessageNodeProps<M extends MessageNodeType> = Omit<
  MessageNode<M>,
  'type' | 'children'
>;

// Styled block nodes are nodes that themselves contain block nodes, rather than
// block nodes that contain inline nodes only (ie, text).
const STYLED_BLOCK_TYPES = [
  MessageNodeType.BULLET,
  MessageNodeType.NUMBER_BULLET,
  MessageNodeType.TODO,
  MessageNodeType.QUOTE,
] as const;

export type MessageStyledBlockType = (typeof STYLED_BLOCK_TYPES)[number];

export function isStyledBlockType(t: any): t is MessageStyledBlockType {
  return STYLED_BLOCK_TYPES.includes(t);
}

export type MessageStyledBlockNode =
  | MessageBulletNode
  | MessageNumberBulletNode
  | MessageTodoNode
  | MessageQuoteNode;

export type FormatStyle = 'normal' | 'action_message';
