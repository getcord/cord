import { Range, Editor, Transforms } from 'slate';
import { EditorCommands } from 'external/src/editor/commands.ts';
import type { Mark } from '@cord-sdk/types';
import { MARKS } from '@cord-sdk/types';

const ALLOWED_PREFIX_CHARS = [' ', '\n', '*', '_', '`'];

const INLINE_MODIFIERS = {
  '`': 'code',
  '*': 'bold',
  '**': 'bold',
  '***': 'bold',
  _: 'italic',
  __: 'italic',
  ___: 'italic',
} as const satisfies Record<string, Mark>;

// When we see an inline modifier, we want to consider whether it is the closing
// delimiter for a valid pair of matching delimiters; if so, we apply the
// appropriate mark to the bounded area and delete the delimiters.
//
// The rules for what makes a valid pair of delimiters are:
// 1. The two delimiters match each other (_abc* is not a pair)
// 2. The two delimiters are in the same block and don't have a newline between
//    them (*abc\ndef* is not a pair)
// 3. The start delimiter is preceded by whitespace, a different delimiter, or
//    the beginning of a line (abc*def* is not a pair, **abc* is not a pair,
//    _*abc* is)
// 4. The start delimiter is not followed by whitespace (* abc* is not a pair)
// 5. The end delimiter is followed by whitespace or the end of a line
//    (inserting an asterisk before the trailing underscore in _*abc_ is not a
//    pair)
// 6. The end delimiter is not preceded by whitespace (*abc * is not a pair)
//
// One thing this does _not_ do is look forward to see if the user just typed
// the beginning delimiter.  That is doable, but it seemed like
// possibly-confusing behavior.
export function findBeginDelimiter(
  before: string,
  after: string,
  key: string,
): { begin: number; delim: string } | null {
  // Check if the next position after the just-typed character disqualifies it
  // from being an end delimiter (rule 5)
  if (after.length > 0 && after[0] !== ' ' && after[0] !== '\n') {
    return null;
  }
  // They've typed a valid end delimiter character, now we walk backwards to
  // find the whole delimiter
  let curPos = before.length;
  while (curPos > 0 && before[curPos - 1] === key) {
    curPos--;
  }

  // The key they pressed isn't part of the text yet, so the delimiter is all
  // the matched characters plus the key they pressed
  const delim = before.substring(curPos) + key;

  // If we matched something but it doesn't have a mark associated with it,
  // ignore it
  if (!(delim in INLINE_MODIFIERS)) {
    return null;
  }

  if (curPos > 0 && before[curPos - 1] === ' ') {
    // If the delimiter is preceded by whitespace, ignore (rule 6)
    return null;
  }

  // Now walk backwards from the start of the delimiter to find another one.  If
  // we do find one, begin will be the (exclusive) end index of the start
  // delimiter.
  let begin = -1;
  while (curPos >= delim.length) {
    if (before[curPos] === '\n') {
      // Found a newline before a matching delimiter, ignore (rule 2)
      return null;
    }
    // Check if the characters ending at curPos are a start delimiter
    if (before.substring(curPos - delim.length, curPos) === delim) {
      if (before[curPos] === ' ') {
        // Found a delimiter but it's followed by whitespace, ignore (rule 4)
        return null;
      }
      // We found it, stop walking
      begin = curPos;
      break;
    }
    curPos--;
  }
  if (begin < 0) {
    // We couldn't find another copy of the delimiter, ignore (rules 1, 2)
    return null;
  }
  if (
    begin > delim.length &&
    !(
      ALLOWED_PREFIX_CHARS.includes(before[begin - delim.length - 1]) &&
      before[begin - delim.length - 1] !== key
    )
  ) {
    // If the delim isn't at the start of the block or preceded by whitespace or
    // a different delimiter, ignore (rule 3)
    return null;
  }
  return {
    begin,
    delim,
  };
}

export function onInlineModifier(editor: Editor, event: React.KeyboardEvent) {
  const { selection } = editor;
  // Ignore if they are overwriting some selected text
  if (!selection || !Range.isCollapsed(selection)) {
    return;
  }
  const block = EditorCommands.getClosestBlock(editor, selection.anchor.path);
  if (!block) {
    // They should always be in a block, so this is just for typechecking
    return;
  }
  const blockStart = Editor.start(editor, block[1]);
  const beforeText = Editor.string(
    editor,
    {
      anchor: blockStart,
      focus: selection.anchor,
    },
    { voids: true },
  );
  const afterText = Editor.string(
    editor,
    {
      anchor: selection.anchor,
      focus: Editor.end(editor, block[1]),
    },
    { voids: true },
  );
  const beginDelim = findBeginDelimiter(beforeText, afterText, event.key);
  if (!beginDelim) {
    return;
  }
  const { begin, delim } = beginDelim;

  const markToApply = INLINE_MODIFIERS[delim as keyof typeof INLINE_MODIFIERS];

  // We have found a valid pair of delimiters!  They are at [begin -
  // delim.length, begin) and [selection.anchor - delim.length - 1,
  // selection.anchor).  Note again that the end delimiter is 1 shorter than the
  // start delimiter (and might be empty) because we're in onKeyDown and thus
  // this character isn't inserted yet.

  // Record the marks that are currently set.  When we change the selection and
  // the marks below, Slate will forget what the active marks were, and then
  // when we put the selection back where it goes it will just inherit the marks
  // that are active there (which includes the mark we're about to apply), which
  // in practice isn't what you want.  For example, if you have italic text and
  // you type *abc*, without this, you'd end up typing further text in bold
  // italic.
  const previousMarks = Editor.marks(editor) ?? {};

  // insideStart and insideEnd are the bounds of the text inside the delimiters
  const insideStart = Editor.after(editor, blockStart, {
    distance: begin,
    unit: 'character',
    voids: true,
  })!;
  const insideEnd =
    delim.length === 1
      ? selection.anchor
      : Editor.before(editor, selection.anchor, {
          distance: delim.length - 1,
          unit: 'character',
          voids: true,
        })!;

  // Mark the text with the appropriate mark
  Transforms.select(editor, { anchor: insideStart, focus: insideEnd });
  Editor.addMark(editor, markToApply, true);

  // Delete the delimiters from the text.  Start with the end one so the first
  // edit doesn't change the position of the second edit.

  // NOTE: We can't use insideEnd here because that location may have changed
  // due to adding the mark to the middle of the text, so use the end of the
  // selection
  Transforms.select(editor, editor.selection!.focus);
  for (let i = delim.length - 1; i > 0; i--) {
    Editor.deleteForward(editor);
  }
  Transforms.select(editor, insideStart);
  for (let i = delim.length; i > 0; i--) {
    Editor.deleteBackward(editor);
  }

  // Finally, set the selection to the position where the character would
  // have been inserted and restore the marks they had
  const newEnd = Editor.after(editor, blockStart, {
    distance: beforeText.length - (2 * delim.length - 1),
    unit: 'character',
    voids: true,
  })!;
  Transforms.select(editor, newEnd);
  for (const mark of MARKS) {
    if (previousMarks[mark]) {
      Editor.addMark(editor, mark, true);
    } else {
      Editor.removeMark(editor, mark);
    }
  }

  event.preventDefault();
}
