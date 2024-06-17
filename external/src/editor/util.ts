import type { Editor } from 'slate';
import { Element, Node, Path, Transforms } from 'slate';
import { Keys } from '@cord-sdk/react/common/const/Keys.ts';
import { EditorCommands } from 'external/src/editor/commands.ts';
import type { MessageContent } from 'common/types/index.ts';
import { isEmptyParagraph } from 'external/src/components/chat/composer/util.ts';

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
