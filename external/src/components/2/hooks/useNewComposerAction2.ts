import { useEffect, useRef } from 'react';
import { ReactEditor } from 'slate-react';

import { Transforms } from 'slate';
import { useComposerActions } from 'external/src/components/chat/composer/hooks/useComposerActions.ts';
import { ComposerContext } from 'external/src/context/composer/ComposerContext.ts';
import type { ComposerAction } from 'external/src/context/composer/ComposerState.ts';
import { createMentionNode } from '@cord-sdk/react/common/lib/messageNode.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

export function useNewComposerAction2() {
  const {
    state: { composerAction },
    editor,
  } = useContextThrowingIfNoProvider(ComposerContext);

  const { createAnnotation, addTask, startAttachFlow } = useComposerActions();

  const prevComposerActionRef = useRef<ComposerAction | null>(null);
  useEffect(() => {
    if (!composerAction) {
      return;
    }
    if (composerAction !== prevComposerActionRef.current) {
      switch (composerAction.type) {
        case 'focusEditor':
          ReactEditor.focus(editor);
          break;
        case 'insertMention':
          // insert a mention followed by a space
          ReactEditor.focus(editor);
          Transforms.insertNodes(
            editor,
            createMentionNode(composerAction.user.id, composerAction.user.name),
          );
          editor.insertText(' ');
          break;
        case 'addAnnotation':
          void createAnnotation();
          break;
        case 'addTask':
          addTask();
          break;
        case 'addFile':
          startAttachFlow();
          break;
      }
      prevComposerActionRef.current = composerAction;
    }
  }, [addTask, composerAction, createAnnotation, editor, startAttachFlow]);
}
