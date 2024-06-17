import * as React from 'react';
import { useCallback, useMemo } from 'react';
import cx from 'classnames';
import { Button } from '../../../experimental/components/helpers/Button.js';
import {
  colorsTertiary,
  medium,
} from '../../../components/helpers/Button.classnames.js';

import { useMentionList } from '../../../experimental/components/composer/MentionList.js';
import { EditorCommands } from '../lib/commands.js';
import type { ComposerProps } from '../../../experimental/types.js';

export function useAddMentionToComposer(
  options: Pick<ComposerProps, 'editor' | 'isEmpty' | 'groupID'>,
): Pick<
  ComposerProps,
  | 'toolbarItems'
  | 'onKeyDown'
  | 'onChange'
  | 'editor'
  | 'popperElement'
  | 'popperElementVisible'
  | 'popperOnShouldHide'
> {
  const { editor, isEmpty, groupID } = options;
  const mentionList = useMentionList({
    editor,
    groupID,
  });
  const onKeyDown = useCallback(
    (args: { event: React.KeyboardEvent }) => {
      if (mentionList.handleKeyDown(args.event)) {
        return true;
      }
      return false;
    },
    [mentionList],
  );
  const onChange = useCallback(() => {
    mentionList.updateUserReferences();
  }, [mentionList]);

  const handleAddAtCharacter = useCallback(() => {
    EditorCommands.addText(editor, editor.selection, isEmpty ? '@' : ' @');
  }, [isEmpty, editor]);

  const toolbarItems = useMemo(() => {
    return [
      {
        name: 'addMention',
        element: (
          <Button
            key="add-mention-button"
            canBeReplaced
            buttonAction="add-mention"
            className={cx(colorsTertiary, medium)}
            icon="At"
            onClick={handleAddAtCharacter}
            disabled={mentionList.isOpen}
          />
        ),
      },
    ];
  }, [handleAddAtCharacter, mentionList.isOpen]);
  return useMemo(
    () => ({
      toolbarItems,
      onKeyDown,
      onChange,
      editor: mentionList.editor,
      popperElement: mentionList.Component,
      popperElementVisible: mentionList.isOpen,
      popperOnShouldHide: mentionList.close,
    }),
    [
      onKeyDown,
      onChange,
      toolbarItems,
      mentionList.editor,
      mentionList.Component,
      mentionList.isOpen,
      mentionList.close,
    ],
  );
}
