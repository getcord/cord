import { createEditor as createSlateEditor } from 'slate';
import { withHistory } from 'slate-history';
import { withReact } from 'slate-react';
import { withUserReferences } from 'external/src/components/chat/composer/userReferences/util.ts';
import { withBullets } from 'external/src/editor/bullets.ts';
import { withHTMLPaste } from 'external/src/editor/paste/index.ts';
import { withEmojis } from 'external/src/components/chat/composer/withEmojis.ts';
import { withQuotes } from 'external/src/editor/quotes.ts';

export function createEditor() {
  return withHTMLPaste(
    withQuotes(
      withBullets(
        withUserReferences(
          withEmojis(withReact(withHistory(createSlateEditor()))),
        ),
      ),
    ),
  );
}
