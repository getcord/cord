import { Transforms, Element, Editor, Path, Node } from 'slate';
import { MessageNodeType } from '@cord-sdk/types';
import type { MessageNumberBulletNode } from '@cord-sdk/types';
import { isBullet, isIndentable } from '../lib/util.js';
import {
  MAX_BULLET_INDENT,
  isMessageNodeType,
} from '../../../common/lib/messageNode.js';

export function withBullets(editor: Editor) {
  const { normalizeNode } = editor;

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;

    if (Element.isElement(node) && isBullet(node)) {
      // Ensure no bullets are indented more than the max
      if (isIndentable(node) && (node.indent ?? 0) > MAX_BULLET_INDENT) {
        Transforms.setNodes(
          editor,
          { indent: MAX_BULLET_INDENT },
          { at: path },
        );
        return;
      }
      // Ensure bullet contents are block elements
      //
      // This is because bullets need to be able to contain annotations, which are block elements
      // Contents of slate nodes must all be either inline or block - you can't mix them
      for (let i = node.children.length - 1; i >= 0; i--) {
        const child = node.children[i];
        const isBlock =
          Element.isElement(child) && Editor.isBlock(editor, child);
        if (!isBlock) {
          Transforms.wrapNodes(
            editor,
            { children: [], type: MessageNodeType.PARAGRAPH },
            { at: [...path, i] },
          );
          return;
        }
      }
      if (node.type === MessageNodeType.NUMBER_BULLET) {
        if (normalizeBullet(node, path, editor)) {
          return;
        }
      }
    }
    // Also check if the edited node is next to a bullet.  This can happen if we
    // insert a non-bullet node between two bullets and all the subsequent
    // bullets need to get renumbered from 1.
    if (Element.isElement(node)) {
      const nextPath = Path.next(path);
      if (Node.has(editor, nextPath)) {
        const [nextNode] = Editor.node(editor, nextPath);
        if (
          'type' in nextNode &&
          nextNode.type === MessageNodeType.NUMBER_BULLET
        ) {
          if (normalizeBullet(nextNode, nextPath, editor)) {
            return;
          }
        }
      }
    }

    // Fall back to the original `normalizeNode` to enforce other constraints.
    normalizeNode(entry);
  };

  return editor;
}

// Ensure that the given bullet number node has a number one after its previous
// sibling bullet, or 1 if it doesn't have a sibling
function normalizeBullet(
  node: MessageNumberBulletNode,
  path: Path,
  editor: Editor,
): boolean {
  let prevBulletNumber = 0;
  const parentPath = Path.parent(path);
  for (let i = path[path.length - 1] - 1; i >= 0; i--) {
    const [prev] = Editor.node(editor, [...parentPath, i]);
    if (isIndentable(prev) && (prev.indent ?? 0) > (node.indent ?? 0)) {
      // prev is a node that's indented more than this node, skip it for finding
      // the previous node.
      continue;
    }
    if (
      isMessageNodeType(prev, MessageNodeType.NUMBER_BULLET) &&
      (prev.indent ?? 0) === (node.indent ?? 0)
    ) {
      prevBulletNumber = prev.bulletNumber;
    }
    break;
  }
  if (node.bulletNumber !== prevBulletNumber + 1) {
    Transforms.setNodes(
      editor,
      { bulletNumber: prevBulletNumber + 1 },
      { at: path },
    );
    return true;
  }
  return false;
}
