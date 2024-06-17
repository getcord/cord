import type { RenderElementProps, RenderLeafProps } from 'slate-react';
import { withReact } from 'slate-react';
import type { Editor } from 'slate';
import { createEditor as createSlateEditor, Text, Transforms } from 'slate';
import { MessageNodeType } from 'common/types/index.ts';
import type {
  MessageParagraphNode,
  MessageAssigneeNode,
  MessageNodeWithChildren,
} from '@cord-sdk/types';
import { MessageReassigneeElement } from 'external/src/components/chat/messageReassigner/ReassigneeElement.tsx';
import { withUserReferences } from 'external/src/components/chat/composer/userReferences/util.ts';
import { replaceAll } from 'common/util/index.ts';

export const reassignerRenderElement = ({
  element: el,
  attributes,
  children,
}: RenderElementProps) => {
  const element: MessageParagraphNode | MessageAssigneeNode = el as any;
  switch (element.type) {
    case MessageNodeType.ASSIGNEE:
      return (
        <MessageReassigneeElement
          userID={element.user.id}
          attributes={attributes}
          elementChildren={element.children}
        >
          {children}
        </MessageReassigneeElement>
      );
    case MessageNodeType.PARAGRAPH: {
      return <p {...attributes}>{children}</p>;
    }
    default: {
      return <span {...attributes}>{children}</span>;
    }
  }
};

export const reassignerRenderLeaf = ({
  attributes,
  children,
}: RenderLeafProps) => {
  return <span {...attributes}>{children}</span>;
};

function withNormalize(editor: Editor) {
  const { normalizeNode } = editor;

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;
    if (Text.isText(node)) {
      const firstElement = path[path.length - 1] === 0;
      const lastElement =
        path[path.length - 1] ===
        (editor.children as MessageNodeWithChildren[])[0].children.length - 1;
      if (node.type !== MessageNodeType.ASSIGNEE && node.text !== '') {
        let insertPlus = false;

        if (firstElement) {
          insertPlus = !node.text.startsWith('+');
        } else {
          insertPlus = node.text.length >= 2 && !node.text.startsWith(' +');
        }
        // Add '+' if necessary
        if (insertPlus) {
          let newText = firstElement ? '+' : ' +';
          if (lastElement) {
            // If last element, we don't want any spaces at all
            newText += replaceAll(node.text, ' ', '');
          } else {
            // If not last element, we allow a space at the end
            newText +=
              replaceAll(node.text.slice(0, node.text.length - 1), ' ', '') +
              node.text[node.text.length - 1];
          }

          Transforms.insertText(editor, newText, { at: path });
          if (newText.endsWith(' ')) {
            Transforms.move(editor, { distance: 1, reverse: true });
          }
        }
        // Disallow two spaces in a row - this should never happen
        if (node.text.includes('  ')) {
          Transforms.insertText(editor, replaceAll(node.text, '  ', ' '), {
            at: path,
          });
        }
        // Disallow any unexpected scenarios where a space is put after '+ '
        // Can happen in several ways so this is a catch all
        if (node.text.includes('+ ')) {
          Transforms.insertText(editor, replaceAll(node.text, '+ ', '+'), {
            at: path,
          });
        }
      }
    }
    // Fall back to the original `normalizeNode` to enforce other constraints.
    normalizeNode(entry);
  };

  return editor;
}

export function createReassignerEditor() {
  return withNormalize(withUserReferences(withReact(createSlateEditor())));
}
