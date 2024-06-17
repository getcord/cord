import { Element, Editor, Range, Path, Transforms } from 'slate';

import { Keys } from '@cord-sdk/react/common/const/Keys.ts';
import { EditorCommands } from 'external/src/editor/commands.ts';
import { isQuote } from 'external/src/components/chat/composer/util.ts';
import { isMessageNodeText } from '@cord-sdk/react/common/lib/messageNode.ts';
import type { MessageNode } from 'common/types/index.ts';
import type { MessageTextNode } from '@cord-sdk/types';

// Add/remove extra text nodes when moving down/up from annotations/quotes but no space
export function onArrow(editor: Editor, event: React.KeyboardEvent) {
  const { selection } = editor;

  if (!selection || !Range.isCollapsed(selection)) {
    return;
  }

  const up = event.key === Keys.ARROW_UP || event.key === Keys.ARROW_LEFT;
  const node = Editor.node(editor, selection.anchor)[0] as MessageNode;

  const nodeParent = Editor.parent(editor, selection.anchor.path);

  const nextPointInDirection = up
    ? Editor.before(editor, selection.anchor)
    : Editor.after(editor, selection.anchor);
  if (nextPointInDirection) {
    // If there is somewhere to move, let it go

    // Special case: if we're currently in an inline node, and the next location
    // is a 0-length text node in the same block, then we want to move the
    // selection out of the inline node and into the text node, but Slate
    // doesn't do that by default, so do it ourselves.  In particular, this
    // happens if the final thing in a message is a link and the user wants to
    // type stuff after it.

    if (
      Element.isElement(nodeParent[0]) &&
      Editor.isInline(editor, nodeParent[0])
    ) {
      const nodeBlock = Editor.above(editor, {
        at: selection.anchor.path,
        match: (n) => !(Element.isElement(n) && Editor.isInline(editor, n)),
      });
      const nextNodeBlock = Editor.above(editor, {
        at: nextPointInDirection,
        match: (n) => !(Element.isElement(n) && Editor.isInline(editor, n)),
      });
      const nextNode = Editor.node(editor, nextPointInDirection);
      if (
        nodeBlock &&
        nextNodeBlock &&
        nodeBlock[0] === nextNodeBlock[0] &&
        (nextNode[0] as MessageTextNode).text === ''
      ) {
        Transforms.select(editor, nextPointInDirection);
      }
    }

    return;
  }

  if (isQuote(nodeParent[0])) {
    // Add empty line to move into
    event.preventDefault();
    const insertionPath = up ? nodeParent[1] : Path.next(nodeParent[1]);
    EditorCommands.addParagraph(editor, insertionPath);
  } else if (isMessageNodeText(node) && node.code && !up) {
    event.preventDefault();
    Editor.removeMark(editor, 'code');
    EditorCommands.addText(editor, selection, ' ');
  }
}
