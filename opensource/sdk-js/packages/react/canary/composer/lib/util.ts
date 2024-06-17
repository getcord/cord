import { Node, Path, Editor, Text, Element, Transforms } from 'slate';
import { MessageNodeType } from '@cord-sdk/types';
import type {
  MessageAssigneeNode,
  MessageBulletNode,
  MessageCodeNode,
  MessageContent,
  MessageMentionNode,
  MessageNumberBulletNode,
  MessageParagraphNode,
  MessageQuoteNode,
  MessageStyledBlockNode,
  MessageTodoNode,
} from '@cord-sdk/types';
import { Keys } from '../../../common/const/Keys.js';
import { isEqual } from '../../../common/lib/fast-deep-equal.js';
import {
  createMessageNode,
  isMessageNodeType,
} from '../../../common/lib/messageNode.js';
import { EditorCommands } from './commands.js';

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

export function deleteVoidNodeOnPressDelete(
  editor: Editor,
  event: React.KeyboardEvent,
  path: Path,
) {
  if (!(event.key === Keys.BACKSPACE || event.key === Keys.DELETE)) {
    return false;
  }
  const nodeParent = Node.parent(editor, path);
  if (Element.isElement(nodeParent) && editor.isVoid(nodeParent)) {
    event.preventDefault();
    const parentPath = Path.parent(path);
    Transforms.removeNodes(editor, {
      at: parentPath,
    });
    const nodesLeftOver = Array.from(
      Node.children(editor, Path.parent(parentPath)),
    );

    if (!nodesLeftOver.length) {
      EditorCommands.addParagraph(editor, parentPath);
    } else {
      // Set selection to next node if DEL pressed and next node exists
      // Otherwise set selection to prev node
      const removedNodeIndex = parentPath[parentPath.length - 1];
      const nextNodeEntry = nodesLeftOver[removedNodeIndex];
      const prevNodeEntry = nodesLeftOver[removedNodeIndex - 1];
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      const [, path] =
        Keys.DELETE && nextNodeEntry ? nextNodeEntry : prevNodeEntry;
      Transforms.select(editor, path);
      EditorCommands.moveSelectionToEndOfText(editor);
    }
    return true;
  }
  return false;
}

export function removeEmptyTopLevelParagraphs(content: MessageContent) {
  return content.filter((topLevelNode) => !isEmptyParagraph(topLevelNode));
}

export const editableStyle = {
  userModify: 'read-write',
  MozUserModify: 'read-write',
  WebkitUserModify: 'read-write',
} as const;

// Important not to use this value directly, as Slate gets confused two
// editors have the same value by reference. This can lead to a bug where
// onChange fires for multiple editors
const COMPOSER_EMPTY_VALUE_FOR_COMPARING =
  /* @__PURE__ */ createComposerEmptyValue();
export function createComposerEmptyValue() {
  return [
    createMessageNode(MessageNodeType.PARAGRAPH, {
      children: [{ text: '' }],
    }),
  ];
}
export function isComposerEmpty(value: MessageContent) {
  return (
    isEqual(value, COMPOSER_EMPTY_VALUE_FOR_COMPARING) || isEqual(value, [])
  );
}

export function hasComposerOnlyWhiteSpaces(value: MessageContent) {
  const texts = Node.texts({ children: value } as Node);
  let doneIterating = false;
  while (!doneIterating) {
    const next = texts.next();
    if (next.done) {
      doneIterating = true;
    } else {
      const [textNode, _path] = next.value;
      if (textNode.text.trim().length > 0) {
        return false;
      }
    }
  }
  return true;
}
