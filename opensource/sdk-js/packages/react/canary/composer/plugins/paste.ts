import { Transforms, Node as SlateNode, Editor, Range } from 'slate';
import * as linkify from 'linkifyjs';
import { MessageNodeType } from '@cord-sdk/types';
import type { MessageLinkNode } from '@cord-sdk/types';
import { isCodeBlock } from '../lib/util.js';
import {
  deserializeElementToMessageContent,
  cleanPastedNodes,
} from '../lib/paste.js';
import { convertStructuredMessageToText } from '../../../common/lib/messageNode.js';

export const withHTMLPaste = (editor: Editor) => {
  const { insertData, insertText, isInline } = editor;

  editor.isInline = (element) =>
    element.type === MessageNodeType.LINK || isInline(element);

  // override the insertData function that triggers on paste
  editor.insertData = (data) => {
    const text = data.getData('text');
    const html = data.getData('text/html');
    const { selection } = editor;
    const currentBlock =
      selection && SlateNode.parent(editor, selection.anchor.path);
    const pastingIntoCodeBlock = Boolean(
      currentBlock && isCodeBlock(currentBlock),
    );
    if (selection && !Range.isCollapsed(selection) && linkify.test(text)) {
      const linkNode: MessageLinkNode = {
        type: MessageNodeType.LINK,
        url: text,
        children: [],
      };
      Transforms.wrapNodes(editor, linkNode, { split: true });
    } else if (html) {
      const parsed = new DOMParser().parseFromString(html, 'text/html');

      const nodes = deserializeElementToMessageContent(
        parsed.body,
        pastingIntoCodeBlock,
      );

      if (pastingIntoCodeBlock) {
        const cleanNodes = cleanPastedNodes(nodes, false);
        const textFromMessage = convertStructuredMessageToText(cleanNodes);
        Transforms.insertFragment(editor, [{ text: textFromMessage }]);
      } else {
        let selectionVsEnd = 0;
        const cleanNodes = cleanPastedNodes(nodes);

        if (selection) {
          const selectedPath = selection.anchor.path;
          selectionVsEnd = editor.children.length - 1 - selectedPath[0];
          Transforms.insertFragment(editor, cleanNodes);
        } else {
          Transforms.insertNodes(editor, cleanNodes);
        }

        Transforms.select(
          editor,
          Editor.end(editor, [editor.children.length - 1 - selectionVsEnd]),
        );
      }
    } else if (pastingIntoCodeBlock) {
      // insertData will split the text on newlines and insert separate block
      // elements for each line.  We don't want that for code blocks, because
      // that would put them in separate quotes/blocks, so insert the text
      // directly, newlines included.
      insertText(text);
    } else {
      insertData(data);
    }
  };

  return editor;
};
