import type { Editor } from 'slate';
import { Range, Transforms, Path, Node, Text } from 'slate';
import { EditorCommands } from 'external/src/editor/commands.ts';
import {
  isStyledBlockEmpty,
  isCodeBlock,
  isBullet,
  isLastBlockInStyledBlock,
  isEmptyParagraph,
} from 'external/src/components/chat/composer/util.ts';
import { isMessageNodeType } from '@cord-sdk/react/common/lib/messageNode.ts';
import { MessageNodeType } from 'common/types/index.ts';

// Add/remove extra text nodes when moving down/up from annotations/quotes but no space
export function onShiftEnter(editor: Editor, event: React.KeyboardEvent) {
  const { selection } = editor;

  if (!selection || !Range.isCollapsed(selection)) {
    return;
  }

  const { path, offset } = selection.anchor;

  const node = Node.get(editor, path);
  const parent = Node.parent(editor, path);

  const styledBlock = EditorCommands.getParentStyledBlock(editor);
  if (styledBlock) {
    if (isStyledBlockEmpty(styledBlock[0])) {
      // Delete styled block if empty
      event.preventDefault();
      EditorCommands.toggleBlock(editor, styledBlock[0].type);
    } else if (isBullet(styledBlock[0])) {
      // Add bullet, or move into next one if empty
      event.preventDefault();
      EditorCommands.addBullet(
        editor,
        selection,
        styledBlock[1],
        (styledBlock[0] as any).indent ?? 0,
      );
    } else if (
      isEmptyParagraph(parent) &&
      isLastBlockInStyledBlock(editor, styledBlock[0], path)
    ) {
      // If it's not a bullet, end the styled block if we're at the very end of it
      event.preventDefault();
      Transforms.removeNodes(editor, { at: Path.parent(path) });
      EditorCommands.addParagraph(editor, Path.next(styledBlock[1]));
    }
    return;
  }

  if (isCodeBlock(parent) && Text.isText(node)) {
    const parentType = parent.type;
    event.preventDefault();
    const { text } = node;
    // Remove block if empty
    if (text === '') {
      event.preventDefault();
      EditorCommands.toggleBlock(editor, parentType);
      return;
    }
    const selectionAtEnd = offset === text.length;
    if (selectionAtEnd && text[offset - 1] === '\n') {
      // If in empty line, delete line and add paragraph
      editor.deleteBackward('character');
      EditorCommands.addParagraph(editor, Path.next(Path.parent(path)));
      return;
    }

    // Add newline in quote
    editor.insertText('\n');
    Transforms.move(editor, { distance: 1 });
    return;
  }

  // If they type exactly ``` and then shift-enter, replace that with a code block
  if (
    Text.isText(node) &&
    path.length === 2 &&
    offset === 3 &&
    isMessageNodeType(parent, MessageNodeType.PARAGRAPH)
  ) {
    const text = node.text.slice(0, offset);
    if (text === '```') {
      event.preventDefault();
      Transforms.delete(editor, {
        distance: offset,
        unit: 'character',
        reverse: true,
      });
      EditorCommands.toggleBlock(editor, MessageNodeType.CODE);
      return;
    }
  }
}
