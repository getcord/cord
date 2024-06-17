import { Transforms, Element, Editor } from 'slate';
import { MessageNodeType } from 'common/types/index.ts';
import { isQuote } from 'external/src/components/chat/composer/util.ts';

export function withQuotes(editor: Editor) {
  const { normalizeNode } = editor;

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;

    // Ensure quote contents are block elements
    //
    // Historically, quotes directly contained only inline elements, but in Dec
    // 2023 we wanted to add bullets within quotes as well.  To support that,
    // convert from containing inline elements to containing block ones, and
    // wrap any contained inline elements in a paragraph.
    if (Element.isElement(node) && isQuote(node)) {
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
    }

    // Fall back to the original `normalizeNode` to enforce other constraints.
    normalizeNode(entry);
  };

  return editor;
}
