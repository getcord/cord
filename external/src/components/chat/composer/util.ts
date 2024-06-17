import { Node, Path, Editor, Text, Element } from 'slate';
import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';
import { MessageNodeType } from 'common/types/index.ts';
import { isMessageNodeType } from '@cord-sdk/react/common/lib/messageNode.ts';
import type {
  MessageAssigneeNode,
  MessageBulletNode,
  MessageCodeNode,
  MessageMentionNode,
  MessageNumberBulletNode,
  MessageParagraphNode,
  MessageQuoteNode,
  MessageStyledBlockNode,
  MessageTodoNode,
} from '@cord-sdk/types';

export function isEmptyParagraph(node: Node): node is MessageParagraphNode {
  return Boolean(
    node &&
      isMessageNodeType(node, MessageNodeType.PARAGRAPH) &&
      isEqual(node.children, [{ text: '' }]),
  );
}

export const isQuote = (node: Node | undefined): node is MessageQuoteNode => {
  return isMessageNodeType(node, MessageNodeType.QUOTE);
};

export function isStyledBlock(
  node: Node | undefined,
): node is
  | MessageQuoteNode
  | MessageBulletNode
  | MessageNumberBulletNode
  | MessageTodoNode {
  return isQuote(node) || isBullet(node);
}

export function isCodeBlock(node: Node | undefined): node is MessageCodeNode {
  return isMessageNodeType(node, MessageNodeType.CODE);
}

export function isUserReferenceNode(
  node: Node | undefined,
): node is MessageMentionNode | MessageAssigneeNode {
  return (
    isMessageNodeType(node, MessageNodeType.MENTION) ||
    isMessageNodeType(node, MessageNodeType.ASSIGNEE)
  );
}

export function isStyledBlockEmpty(node: MessageStyledBlockNode) {
  return node.children.length === 1 && isEmptyParagraph(node.children[0]);
}

export function isStartOfBlock(
  editor: Editor,
  path: Path,
  offset: number,
  blockPath: Path,
) {
  const parentNode = Editor.node(editor, Path.parent(path))[0];
  return (
    path.slice(blockPath.length).every((val) => val === 0) &&
    offset === 0 &&
    !(Element.isElement(parentNode) && Editor.isVoid(editor, parentNode))
  );
}

export function isLastBlockInStyledBlock(
  editor: Editor,
  styledBlock: MessageStyledBlockNode,
  path: Path,
) {
  let node = Editor.node(editor, path)[0];
  while (node !== styledBlock && path.length > 0) {
    if (Node.has(editor, Path.next(path))) {
      return false;
    }
    path = path.slice(0, path.length - 1);
    node = Editor.node(editor, path)[0];
  }
  return true;
}

export function isBullet(
  node: Node | undefined,
): node is MessageBulletNode | MessageNumberBulletNode | MessageTodoNode {
  return (
    isMessageNodeType(node, MessageNodeType.BULLET) ||
    isMessageNodeType(node, MessageNodeType.NUMBER_BULLET) ||
    isMessageNodeType(node, MessageNodeType.TODO)
  );
}

export function isIndentable(
  node: Node | undefined,
): node is MessageBulletNode | MessageNumberBulletNode {
  return (
    isMessageNodeType(node, MessageNodeType.BULLET) ||
    isMessageNodeType(node, MessageNodeType.NUMBER_BULLET)
  );
}

export function isOffsetAtEnd(node: Node, offset: number) {
  return Text.isText(node) && node.text && offset === node.text.length;
}

// Arrow is drawn from the middle left of the box in chat/composer to the pointer on webpage
export function getAnnotationArrowStartPosition(annotationBox: HTMLElement) {
  const clientRect = annotationBox.getBoundingClientRect();
  return {
    x: clientRect.x,
    y: clientRect.y + clientRect.height / 2,
  };
}
