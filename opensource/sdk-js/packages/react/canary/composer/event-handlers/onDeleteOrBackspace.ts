import { Element, Editor, Range, Node, Transforms, Path } from 'slate';
import { MessageNodeType } from '@cord-sdk/types';
import { EditorCommands } from '../lib/commands.js';
import {
  deleteVoidNodeOnPressDelete,
  isStartOfBlock,
  isCodeBlock,
} from '../lib/util.js';
import { isEqual } from '../../../common/lib/fast-deep-equal.js';
import { Keys } from '../../../common/const/Keys.js';
import {
  createMessageNode,
  isMessageNodeType,
} from '../../../common/lib/messageNode.js';

export function onDeleteOrBackspace(
  editor: Editor,
  event: React.KeyboardEvent,
) {
  const { selection } = editor;
  if (!selection) {
    return;
  }
  const { offset, path } = selection.anchor;
  // Handle select all case. Without this, slate struggles to delete non-editable
  // nodes (e.g. bullets, annotations) and leaves detritus
  if (offset === 0 && Range.isExpanded(selection)) {
    const allSelected = isEqual(selection, Editor.range(editor, []));
    if (allSelected) {
      event.preventDefault();
      Transforms.delete(editor);
      Transforms.removeNodes(editor, { at: [0] });
      Transforms.insertNodes(
        editor,
        createMessageNode(MessageNodeType.PARAGRAPH, {
          children: [{ text: '' }],
        }),
      );
      return;
    }
  }

  const nodeParentPath = Path.parent(path);
  const nodeParent = Node.get(editor, nodeParentPath);

  const deletedVoidNode = deleteVoidNodeOnPressDelete(editor, event, path);
  if (deletedVoidNode) {
    return;
  }

  if (event.key === Keys.BACKSPACE) {
    if (Range.isCollapsed(selection)) {
      // Deleting bullet/quote
      // Editor.previous caters for situations like if there is a mention at start of bullet
      if (
        !Editor.previous(editor, { at: path }) &&
        offset === 0 &&
        !(Element.isElement(nodeParent) && Editor.isVoid(editor, nodeParent))
      ) {
        const parentStyledBlock = EditorCommands.getParentStyledBlock(editor);
        if (
          parentStyledBlock &&
          isStartOfBlock(editor, path, offset, parentStyledBlock[1])
        ) {
          event.preventDefault();
          EditorCommands.toggleBlock(editor, parentStyledBlock[0].type);
          return;
        }
        if (isCodeBlock(nodeParent)) {
          const prev = Editor.previous(editor, { at: nodeParentPath });
          if (!prev || !isMessageNodeType(prev[0], nodeParent.type)) {
            event.preventDefault();
            EditorCommands.toggleBlock(editor, nodeParent.type);
            return;
          }
        }
      }
    }
  }
}
