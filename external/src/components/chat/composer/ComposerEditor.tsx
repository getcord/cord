import * as React from 'react';
import { useMemo, useCallback, useEffect, useRef } from 'react';
import { createUseStyles } from 'react-jss';
import type { Editor } from 'slate';
import { Node } from 'slate';
import { Editable, ReactEditor } from 'slate-react';
import cx from 'classnames';
import isHotkey from 'is-hotkey';
import { v4 as uuid } from 'uuid';

import type { CSSVariable } from 'common/ui/cssVariables.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { Keys } from '@cord-sdk/react/common/const/Keys.ts';
import { ComposerContext } from 'external/src/context/composer/ComposerContext.ts';
import { Sizes } from 'common/const/Sizes.ts';
import type { MessageContent } from 'common/types/index.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { renderElement, renderLeaf } from 'external/src/editor/render.tsx';
import { EditorCommands, HOTKEYS } from 'external/src/editor/commands.ts';
import type { useUserReferences } from 'external/src/components/chat/composer/userReferences/useUserReferences.tsx';
import { onDeleteOrBackspace } from 'external/src/components/chat/composer/onKeyPress/onDeleteOrBackspace.ts';
import { onArrow } from 'external/src/components/chat/composer/onKeyPress/onArrowPress.ts';
import { editorStyles } from 'common/ui/editorStyles.ts';
import { onShiftEnter } from 'external/src/components/chat/composer/onKeyPress/onShiftEnter.ts';
import type { useSlashMenu } from 'external/src/components/chat/composer/slashMenu/useSlashMenu.tsx';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { Portal } from 'external/src/components/Portal.tsx';
import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';
import { PortalContext } from 'external/src/context/portal/PortalContext.tsx';
import { JssResetInjector } from 'external/src/common/JssResetInjector.tsx';
import { doNothing } from 'external/src/lib/util.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { externalizeID } from 'common/util/externalIDs.ts';
import type { ComposerHeight } from 'external/src/components/2/Composer3.tsx';
import { onSpace } from 'external/src/components/chat/composer/onKeyPress/onSpace.ts';
import { onInlineModifier } from 'external/src/components/chat/composer/onKeyPress/onInlineModifier.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { getThreadSummary } from 'common/util/convertToExternal/thread.ts';
import type { ComposerWebComponentEvents } from '@cord-sdk/types';
import { onTab } from 'external/src/components/chat/composer/onKeyPress/onTab.ts';

interface ComposerEditorProps {
  onSendOrEdit: () => void;
  updateTyping: (isTyping: boolean) => void;
  editor: Editor;
  userReferences: ReturnType<typeof useUserReferences>;
  slashMenu: ReturnType<typeof useSlashMenu>;
  placeholder?: string;
  composerExpanded?: boolean;
  setComposerExpanded?: React.Dispatch<React.SetStateAction<boolean>>;
  size?: ComposerHeight;
}

// WARNING:
// The height of the dummy send button and the composerEditor
// margins are tightly coupled, so they appear aligned. Please
// make sure that if you change one of them, you check the
// alignment of the composer
export const COMPOSER_COUPLED_CSS_VARS: {
  height: CSSVariable;
  margin: CSSVariable;
} = {
  height: 'space-xl',
  margin: 'space-4xs',
};

const useStyles = createUseStyles({
  textareaWrap: {
    alignItems: 'stretch',
    background: 'none',
    flexGrow: '1',
    fontSize: Sizes.DEFAULT_TEXT_SIZE_PX + 'px',
    lineHeight: Sizes.DEFAULT_LINE_HEIGHT_PX + 'px',
    outline: 'none',
    resize: 'none',
    marginTop: cssVar(COMPOSER_COUPLED_CSS_VARS.margin),
    marginBottom: cssVar(COMPOSER_COUPLED_CSS_VARS.margin),
  },
  minHeightContainer: {
    minHeight: cssVar('space-3xl'),
  },
  editor2: {
    ...editorStyles,
    outline: 'none',
    '& > :not(:first-child) ': {
      marginTop: `${Sizes.MESSAGE_PARAGRAPH_TOP_MARGIN}px`,
    },
  },
  placeholder: {
    bottom: 0,
    color: cssVar('color-content-secondary'),
    fontFamily: cssVar('font-family'),
    left: 0,
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  composerSelectable: {
    cursor: 'text',
  },
});

export const ComposerEditor = React.memo(function ComposerEditor({
  onSendOrEdit,
  updateTyping,
  editor,
  userReferences,
  slashMenu,
  placeholder = 'Type a message...',
  composerExpanded = true,
  setComposerExpanded,
  size,
}: ComposerEditorProps) {
  const classes = useStyles();

  const { logEvent } = useLogger();

  const { enableTasks } = useContextThrowingIfNoProvider(ConfigurationContext);

  const {
    state: { attachments, editingMessageID },
    dispatch: dispatchComposer,
    setOnChangeRef,
    composerEmpty,
    setSelection,
    clearComposer,
    attachFiles,
  } = useContextThrowingIfNoProvider(ComposerContext);

  const threadsContext = useContextThrowingIfNoProvider(ThreadsContext2);
  const thread2Context = useContextThrowingIfNoProvider(Thread2Context);

  const isDraftThread = thread2Context.threadMode === 'newThread';

  const { threadID, thread } = thread2Context;

  const resolved = threadsContext.resolvedThreadIDsSet.has(threadID);
  const {
    byInternalID: { userByID: userByInternalID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const keyDownReffedArgs = useUpdatingRef({
    editor,
    userReferences,
    slashMenu,
    logEvent,
    attachments,
    onSendOrEdit,
    isDraftThread,

    dispatchComposer,

    editingMessageID,
    clearComposer,
  });

  // Ref args so we don't keep redefining this unnecessarily. Rerenders of
  // Editable can cause calls to ReactEditor.focus() to fail, so we minimise
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const {
        // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        editor,
        // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        userReferences,
        // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        slashMenu,
        // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        logEvent,
        // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        onSendOrEdit,
        // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        editingMessageID,
        // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        clearComposer,
      } = keyDownReffedArgs.current;
      for (const hotkey in HOTKEYS) {
        if (isHotkey.default(hotkey, event as any)) {
          event.preventDefault();
          const mark = HOTKEYS[hotkey];
          EditorCommands.toggleMark(editor, mark);
          return;
        }
      }

      if (userReferences.userReferenceMenuOpen) {
        const type = userReferences.userReferenceType;

        switch (event.key) {
          case Keys.ARROW_DOWN: {
            event.preventDefault();
            userReferences.selectNext();
            logEvent(`navigate-${type!}-list-options`);
            return;
          }

          case Keys.ARROW_UP: {
            event.preventDefault();
            userReferences.selectPrev();
            logEvent(`navigate-${type!}-list-options`);
            return;
          }

          case Keys.TAB:
          case Keys.ENTER: {
            event.preventDefault();
            userReferences.insertUserReference();
            return;
          }

          case Keys.ESCAPE: {
            event.preventDefault();
            userReferences.closeUserReferences();
            logEvent(`clear-${type!}-selection`);
            return;
          }

          case Keys.SPACEBAR: {
            const nameTypedIn = userReferences.currentValueRef.current;
            if (nameTypedIn && userReferences.userReferenceUsers.length === 1) {
              event.preventDefault();
              userReferences.insertUserReference();
              return;
            }
          }
        }
      } else if (slashMenu.visible) {
        switch (event.key) {
          case Keys.ARROW_DOWN: {
            event.preventDefault();
            slashMenu.selectNext();
            return;
          }

          case Keys.ARROW_UP: {
            event.preventDefault();
            slashMenu.selectPrev();
            return;
          }

          case Keys.TAB:
          case Keys.ENTER: {
            event.preventDefault();
            slashMenu.chooseSlashMenuItem();
            return;
          }

          case Keys.ESCAPE: {
            event.preventDefault();
            slashMenu.closeMenu();
            return;
          }
        }
      }

      if (event.key === Keys.SPACEBAR) {
        onSpace(editor, event, enableTasks);
        return;
      }

      if (
        event.key === Keys.BACKTICK ||
        event.key === Keys.ASTERISK ||
        event.key === Keys.UNDERSCORE
      ) {
        onInlineModifier(editor, event);
        return;
      }

      if (event.key === Keys.BACKSPACE || event.key === Keys.DELETE) {
        onDeleteOrBackspace(editor, event);
        return;
      }

      if (
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        (event.key === Keys.ARROW_UP ||
          event.key === Keys.ARROW_DOWN ||
          event.key === Keys.ARROW_LEFT ||
          event.key === Keys.ARROW_RIGHT)
      ) {
        onArrow(editor, event);
        return;
      }

      if (event.key === Keys.ENTER) {
        if (event.shiftKey) {
          onShiftEnter(editor, event);
          return;
        } else {
          event.preventDefault();
          onSendOrEdit();
        }
      }

      if (event.key === Keys.TAB) {
        onTab(editor, event);
      }

      if (event.key === Keys.ESCAPE) {
        ReactEditor.blur(editor);
        if (editingMessageID) {
          clearComposer();
        }
      }
    },
    [keyDownReffedArgs, enableTasks],
  );

  const composerRef = useRef<HTMLDivElement>(null);
  const handleEvent = useCallback(
    (eventName: keyof ComposerWebComponentEvents) => {
      composerRef.current?.dispatchEvent(
        new CustomEvent<ComposerWebComponentEvents[typeof eventName]>(
          `cord-composer:${eventName}`,
          {
            bubbles: true,
            composed: true,
            detail: [
              {
                threadId: thread?.externalID ?? externalizeID(threadID),
                thread: thread && getThreadSummary(thread, userByInternalID),
              },
            ],
          },
        ),
      );
    },
    [thread, threadID, userByInternalID],
  );
  const handleFocus = useCallback(() => handleEvent('focus'), [handleEvent]);
  const handleBlur = useCallback(() => handleEvent('blur'), [handleEvent]);

  // Attach pasted images
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const { files } = e.clipboardData;

      if (
        files &&
        files.length > 0 &&
        [...files].every((file) => {
          const [mime] = file.type.split('/');
          return mime === 'image';
        })
      ) {
        e.stopPropagation();
        attachFiles(files).catch(console.warn);
      }
    },
    [attachFiles],
  );

  // onChange prop is passed to <Slate /> component in ComposerProvider. It
  // lives there so that we can access its focus context throughout the tree
  const onChange = useCallback(
    (newValue: MessageContent) => {
      const empty = !newValue.length;
      if (empty) {
        EditorCommands.addParagraph(editor, [0]);
      }
      updateTyping(Node.string(editor).length > 0);
      // Update user references when value OR selection changes
      userReferences.updateUserReferences(editor);
      slashMenu.updateSlashMenu();
      if (editor.selection) {
        setSelection(editor.selection);
      }
    },
    [editor, setSelection, slashMenu, updateTyping, userReferences],
  );
  const onChangeRef = useUpdatingRef(onChange);
  useEffect(() => {
    setOnChangeRef(onChangeRef);
  }, [onChangeRef, setOnChangeRef]);

  const componentElement =
    useContextThrowingIfNoProvider(ComponentContext)?.element;

  // this needs to be stable during the lifetime of this component because it
  // is used in JssResetInjector which only cares about the first value we give it
  const slotName = useRef(`cord-composer-${uuid()}`).current;

  // Rerenders of Editable can cause calls to ReactEditor.focus() to fail
  const memoedEditable = useMemo(() => {
    const editableStyle = {
      userModify: 'read-write',
      MozUserModify: 'read-write',
      WebkitUserModify: 'read-write',
    } as const;

    if (componentElement && componentElement.shadowRoot) {
      // Return the Editable through Portal + <slot> to work around
      // the Safari + Firefox ShadowRoot.getSelection API issues.
      return (
        <PortalContext.Provider value={componentElement}>
          <Portal>
            <JssResetInjector
              rootElementID={slotName}
              rootElement={componentElement}
            >
              <div slot={slotName} id={slotName} data-cy="cord-composer">
                <EditableWithStyles
                  editableStyle={editableStyle}
                  onKeyDown={onKeyDown}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onPaste={handlePaste}
                  readOnly={resolved && composerEmpty}
                  inSdk={true}
                />
              </div>
            </JssResetInjector>
          </Portal>
          <slot name={slotName} />
        </PortalContext.Provider>
      );
    }

    return (
      <EditableWithStyles
        editableStyle={editableStyle}
        onKeyDown={onKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPaste={handlePaste}
        readOnly={resolved && composerEmpty}
        inSdk={false}
      />
    );
  }, [
    onKeyDown,
    handleFocus,
    handleBlur,
    handlePaste,
    resolved,
    composerEmpty,
    componentElement,
    slotName,
  ]);

  const clickableComposerAreaRef = useRef<HTMLDivElement>(null);

  const focusComposer = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === clickableComposerAreaRef.current) {
        // if you clicked the composer area that isn't the text area
        EditorCommands.focusAndMoveCursorToEndOfText(editor);
      }
      setComposerExpanded?.(true);
    },
    [editor, setComposerExpanded],
  );

  return (
    <Box2
      className={cx([classes.textareaWrap], classes['composerSelectable'], {
        [classes.minHeightContainer]: composerExpanded && size !== 'small',
      })}
      forwardRef={clickableComposerAreaRef}
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      onBlur={() => logEvent('composer-became-inactive-blur')}
      onClick={(e) => focusComposer(e)}
    >
      <div style={{ position: 'relative' }} ref={composerRef}>
        {memoedEditable}
        {/* Use our own placeholder as Slate's doesn't allow changing opacity and shows when you've started creating some structure (e.g. list/quote) */}
        {composerEmpty && (
          <span className={classes.placeholder}>
            {/* Enable vendors to change the placeholder */}
            <slot name="composer-placeholder">{placeholder}</slot>
          </span>
        )}
      </div>
    </Box2>
  );
});

type EditableWithStylesProps = {
  editableStyle: React.CSSProperties | undefined;
  readOnly: boolean;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onFocus: (event: React.FocusEvent) => void;
  onBlur: (event: React.FocusEvent) => void;
  onPaste: React.ClipboardEventHandler;
  inSdk: boolean;
};

function EditableWithStyles({
  editableStyle,
  onKeyDown,
  onBlur,
  onFocus,
  onPaste,
  readOnly,
  inSdk,
}: EditableWithStylesProps) {
  const classes = useStyles();

  return (
    <Editable
      className={classes.editor2}
      style={editableStyle}
      renderElement={renderElement}
      renderLeaf={renderLeaf}
      onKeyDown={onKeyDown}
      readOnly={readOnly}
      onFocus={onFocus}
      onBlur={onBlur}
      onPaste={onPaste}
      // Causes issue with the slot/portal approach where document.body scrolls when you type
      // Todo - custom scroll function for sdk?
      scrollSelectionIntoView={inSdk ? doNothing : undefined}
    />
  );
}
