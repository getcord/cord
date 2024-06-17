import type * as React from 'react';
import type { Editor } from 'slate';
import { Transforms, Range, Path } from 'slate';
import { EditorCommands } from 'external/src/editor/commands.ts';
import {
  isIndentable,
  isStartOfBlock,
} from 'external/src/components/chat/composer/util.ts';
import { MAX_BULLET_INDENT } from '@cord-sdk/react/common/lib/messageNode.ts';

export function onTab(editor: Editor, event: React.KeyboardEvent) {
  const { selection } = editor;
  if (!selection || !Range.isCollapsed(selection)) {
    return;
  }
  const { offset, path } = selection.anchor;

  const styledBlock = EditorCommands.getParentStyledBlock(editor);
  if (
    styledBlock &&
    isIndentable(styledBlock[0]) &&
    isStartOfBlock(editor, path, offset, Path.parent(path))
  ) {
    event.preventDefault();
    const node = styledBlock[0];
    let indent = node.indent ?? 0;
    if (event.shiftKey) {
      indent--;
    } else {
      indent++;
    }
    if (0 <= indent && indent <= MAX_BULLET_INDENT) {
      Transforms.setNodes(editor, { indent }, { at: styledBlock[1] });
    }
  }
}
