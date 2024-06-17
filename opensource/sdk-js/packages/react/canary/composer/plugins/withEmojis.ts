import type { Location } from 'slate';
import { Editor } from 'slate';
import EmojiConverter from 'emoji-js';
import { findLastIndex } from '../../../common/lib/findLast.js';

const emoji = /* @__PURE__ */ new EmojiConverter();

/** Automatically replaces colons emojis (e.g. :smile:) with
 * the actual emoji (e.g. 😄)
 */
export const withEmojis = <T extends Editor>(editor: T): T => {
  const { insertText } = editor;
  // Opt out of automatic mode detection. This will always replace
  // `:smile:` with Unicode code points, instead of `<span class"emoji...`
  emoji.replace_mode = 'unified';

  editor.insertText = (lastTypedChar) => {
    if (lastTypedChar === ':') {
      const currentSelection = editor.selection as Location;
      if (!currentSelection) {
        insertText(lastTypedChar);
        return;
      }
      // This code runs before we add ":" to the editor.
      // So `text` looks like this: `:joy`
      const [{ text: currentLineMinusLastChar }] = Editor.leaf(
        editor,
        currentSelection,
      );
      const { offset } = Editor.before(editor, currentSelection) ?? {
        offset: 0,
      };

      const previousColonIndex = findLastIndex(
        currentLineMinusLastChar,
        (char) => char === ':',
        offset,
      );
      if (previousColonIndex !== -1) {
        // Grab the colon emoji  E.g. from  "Foo :joy" grab ":joy", then
        // add ":" to complete the :emoji:!
        const colonEmoji =
          currentLineMinusLastChar.substring(previousColonIndex, offset + 1) +
          lastTypedChar;
        const maybeEmoji = emoji.replace_colons(colonEmoji);

        const foundEmoji = maybeEmoji !== colonEmoji;
        if (foundEmoji) {
          // Replace ":colon_emoji" text in the editor with
          // the actual emoji.
          // -1 because we never added the closing `:`
          const charsToDelete = colonEmoji.length - 1;
          for (let i = 0; i < charsToDelete; i++) {
            Editor.deleteBackward(editor, { unit: 'character' });
          }

          insertText(maybeEmoji);
          return;
        }
      }
    }

    insertText(lastTypedChar);
  };

  return editor;
};
