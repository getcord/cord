import * as React from 'react';
import { useCallback, useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import type { Editor } from 'slate';
import type { Placement } from '@floating-ui/react-dom';

import cx from 'classnames';
import { cssVar } from 'common/ui/cssVariables.ts';
import { ComposerEditor } from 'external/src/components/chat/composer/ComposerEditor.tsx';
import type { useUserReferences } from 'external/src/components/chat/composer/userReferences/useUserReferences.tsx';
import type { useSlashMenu } from 'external/src/components/chat/composer/slashMenu/useSlashMenu.tsx';
import { BoxWithPopper2 } from 'external/src/components/ui2/BoxWithPopper2.tsx';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { Sizes } from 'common/const/Sizes.ts';
import type { ComposerHeight } from 'external/src/components/2/Composer3.tsx';
import { ButtonGroup2 } from 'external/src/components/ui2/ButtonGroup2.tsx';

interface ComposerEditorWrapperProps {
  onSendOrEdit: () => void;
  updateTyping: (isTyping: boolean) => void;
  editor: Editor;
  userReferences: ReturnType<typeof useUserReferences>;
  menu: JSX.Element;
  menuVisible: boolean;
  closeMenu: () => void;
  slashMenu: ReturnType<typeof useSlashMenu>;
  composerExpanded: boolean;
  setComposerExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  sendButton?: JSX.Element;
  placeholder?: string;
  size?: ComposerHeight;
  closeButton?: JSX.Element;
}

const useStyles = createUseStyles({
  editorContainer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  composerScrollContainer: {
    maxHeight: cssVar('composer-height-max'),
  },
  composerLarge: {
    minHeight: cssVar('composer-height-tall'),
  },
  composerMedium: {
    minHeight: `${cssVar('composer-height-min')}`,
  },
  alignItemsFlexStart: {
    alignItems: 'flex-start',
  },
});

/**
 * @deprecated Use ui3/ComposerEditorWrapper instead
 */
export const ComposerEditorWrapper = React.memo(function ComposerEditorWrapper({
  onSendOrEdit,
  updateTyping,
  editor,
  userReferences,
  menu,
  menuVisible,
  closeMenu,
  slashMenu,
  composerExpanded,
  setComposerExpanded,
  sendButton,
  placeholder = 'Type a message...',
  size,
  closeButton,
}: ComposerEditorWrapperProps) {
  const classes = useStyles();

  const offset = useCallback((placement: Placement) => {
    if (placement.includes('bottom')) {
      return -Sizes.SMALL;
    }
    return Sizes.MEDIUM;
  }, []);

  const composerHeight = useMemo(
    () => (size === 'large' ? 'Large' : 'Medium'),
    [size],
  );

  return (
    <BoxWithPopper2
      popperElement={menu}
      popperElementVisible={menuVisible}
      popperPosition="top-start"
      offset={offset}
      onShouldHide={closeMenu}
      popperWidth="full"
    >
      <Box2
        paddingHorizontal={'2xs'}
        scrollable={true}
        className={cx(
          classes.composerScrollContainer,
          classes[`composer${composerHeight}`],
          classes.editorContainer,
        )}
      >
        <ComposerEditor
          onSendOrEdit={onSendOrEdit}
          updateTyping={updateTyping}
          editor={editor}
          userReferences={userReferences}
          slashMenu={slashMenu}
          placeholder={placeholder}
          composerExpanded={composerExpanded}
          setComposerExpanded={setComposerExpanded}
          size={size}
        />
        <ButtonGroup2
          className={cx({ [classes.alignItemsFlexStart]: size === 'large' })}
        >
          {closeButton ?? false}
          {sendButton ?? false}
        </ButtonGroup2>
      </Box2>
    </BoxWithPopper2>
  );
});
