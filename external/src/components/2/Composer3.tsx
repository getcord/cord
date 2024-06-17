import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { ReactEditor } from 'slate-react';

import cx from 'classnames';
import { useCordTranslation } from '@cord-sdk/react';
import type {
  ComposerWebComponentEvents,
  EntityMetadata,
} from '@cord-sdk/types';
import { cssVar } from 'common/ui/cssVariables.ts';
import { DragAndDropDiv } from 'external/src/components/DragAndDropDiv.tsx';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { ComposerMenu3 } from 'external/src/components/2/ComposerMenu3.tsx';
import { useComposerController } from 'external/src/components/chat/composer/composerController.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { useThreadData } from 'external/src/components/2/hooks/useThreadData.ts';
import { useNewComposerAction2 } from 'external/src/components/2/hooks/useNewComposerAction2.ts';
import { ComposerTask } from 'external/src/components/chat/composer/ComposerTask.tsx';
import { ComposerFileAttachments2 } from 'external/src/components/2/ComposerFileAttachments2.tsx';
import { AnnotationElement } from 'external/src/components/chat/composer/annotations/AnnotationElement.tsx';
import { getSingleComposerAnnotation } from 'external/src/components/chat/composer/annotations/util.ts';
import { EditorCommands } from 'external/src/editor/commands.ts';
import type { ThreadData } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { GlobalElementContext } from 'external/src/context/globalElement/GlobalElementContext.ts';
import { ComposerContext } from 'external/src/context/composer/ComposerContext.ts';
import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';
import { ResolvedThreadComposer } from 'external/src/components/2/ResolvedThreadComposer.tsx';
import { EditingMessageBanner } from 'external/src/components/2/EditingMessageBanner.tsx';
import { ComposerEditorWrapper } from 'external/src/components/chat/composer/ComposerEditorWrapper.tsx';
import { useClickOutside } from 'external/src/effects/useClickOutside.ts';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { CSSVariableOverrideContext } from 'external/src/context/cssVariableOverride/CSSVariableOverrideContext.tsx';
import { COMPOSER_COUPLED_CSS_VARS } from 'external/src/components/chat/composer/ComposerEditor.tsx';
import { externalizeID } from 'common/util/externalIDs.ts';
import type { UUID } from 'common/types/index.ts';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';
import { newComposerConfig } from 'external/src/components/ui3/composer/Composer.tsx';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';
import { getThreadSummary } from 'common/util/convertToExternal/thread.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';

const useStyles = createUseStyles({
  composerBorders: {
    border: cssVar('composer-border'),
    borderRadius: cssVar('composer-border-radius'),
  },
  composerContainer: {
    flexShrink: 0,
  },
  composerWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: cssVar('space-2xs'),
    '&:hover $closeButtonHidden, &:focus-within $closeButtonHidden': {
      pointerEvents: 'auto',
      visibility: 'visible',
    },
    '&:focus-within $sendButtonHidden': {
      display: 'block',
      pointerEvents: 'auto',
    },
  },
  focused: {
    '&:focus-within': {
      boxShadow: cssVar('shadow-focus'),
      border: cssVar('composer-border--focus'),
    },
  },

  collapsedComposerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButtonHidden: {
    pointerEvents: 'none',
    visibility: 'hidden',
  },
  sendButtonHidden: {
    display: 'none',
    pointerEvents: 'none',
  },
});

export type ComposerHeight = 'small' | 'medium' | 'large';

export type ComposerProps = {
  // When a composer appears on screen as a result of user action,
  // we likely want to focus it. E.g. users opening a thread.
  // When a composer is already on screen on page load, we likely
  // don't want to focus it. E.g. when our thread component is used
  // to leave comments YouTube/Linear/etc style.
  shouldFocusOnMount?: boolean;
  disabled?: boolean;
  size?: ComposerHeight;
  showBorder?: boolean;
  showExpanded?: boolean;
  showCloseButton?: boolean;
  onClose?: () => unknown;
  onSendMessage?: () => unknown;
  className?: string;
  forwardRef?: React.MutableRefObject<HTMLDivElement | null>;
  showEditingBanner?: boolean;
  threadUrl?: string;
  messageMetadata?: EntityMetadata;
  threadMetadata?: EntityMetadata;
  dispatchMessageEditEndEvent?: () => void;
  loading?: boolean;
};

export const Composer3 = withNewCSSComponentMaybe(
  newComposerConfig,
  function Composer3Int(props: ComposerProps) {
    const { t } = useCordTranslation('thread');
    const thread = useThreadData();
    const { organization } =
      useContextThrowingIfNoProvider(OrganizationContext);
    const showToastPopup =
      useContextThrowingIfNoProvider(GlobalElementContext)?.showToastPopup;
    const { threadID, threadMode } =
      useContextThrowingIfNoProvider(Thread2Context);
    const { setResolved } = useContextThrowingIfNoProvider(ThreadsContext2);
    const {
      byInternalID: { userByID: userByInternalID },
    } = useContextThrowingIfNoProvider(UsersContext);

    const composerControllerValue = useComposerController({
      isDraftThread: threadMode === 'newThread',
      onSendMessage: props.onSendMessage,
      messageMetadata: props.messageMetadata,
      threadMetadata: props.threadMetadata,
      externalOrgID: thread?.externalOrgID ?? organization?.externalID,
      requestMentionableUsers: true,
    });
    useEffect(() => {
      if (!props?.forwardRef) {
        return;
      }

      props.forwardRef.current = composerControllerValue.composerRef.current;
    }, [composerControllerValue.composerRef, props.forwardRef]);

    useNewComposerAction2();
    const reopenThread = useCallback(() => {
      setResolved(threadID, false, true);
      thread?.externalID &&
        props.forwardRef?.current?.dispatchEvent(
          new CustomEvent<ComposerWebComponentEvents['threadreopen']>(
            `cord-composer:threadreopen`,
            {
              bubbles: true,
              composed: true,
              detail: [
                {
                  threadId: thread.externalID,
                  thread: getThreadSummary(thread, userByInternalID),
                },
              ],
            },
          ),
        );
      showToastPopup?.(t('unresolve_action_success'));
    }, [
      setResolved,
      threadID,
      thread,
      props.forwardRef,
      userByInternalID,
      showToastPopup,
      t,
    ]);

    return (
      <Composer3Component
        {...props}
        {...composerControllerValue}
        reopenThread={reopenThread}
        thread={thread}
        threadID={threadID}
      />
    );
  },
);

const Composer3Component = React.memo(function Composer3Component({
  shouldFocusOnMount,
  size,
  editor,
  containerRef,
  composerRef,
  userReferences,
  slashMenu,
  updateTyping,
  sendMessage,
  enableAttachments,
  menu,
  menuVisible,
  closeMenu,
  onDrop,
  task,
  attachments,
  editingMessageID,
  clearComposer,
  thread,
  threadID,
  reopenThread,
  showBorder,
  showExpanded = false,
  showCloseButton = false,
  onClose,
  showEditingBanner = true,
  className,
}: ComposerProps &
  ReturnType<typeof useComposerController> & {
    reopenThread: () => void;
    thread: ThreadData | null;
    threadID: UUID;
  }) {
  const { t } = useCordTranslation('composer');
  const classes = useStyles();

  const singleAnnotation = useMemo(
    () => getSingleComposerAnnotation(attachments),
    [attachments],
  );
  const [composerExpanded, setComposerExpanded] =
    useState<boolean>(showExpanded);

  const { composerValid } = useContextThrowingIfNoProvider(ComposerContext);
  const componentName = useContextThrowingIfNoProvider(ComponentContext)?.name;
  const cssOverrideContext = useContextThrowingIfNoProvider(
    CSSVariableOverrideContext,
  );
  const {
    byInternalID: { userByID: userByInternalID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const isInSidebar = componentName === 'cord-sidebar';

  const hasFilesAttached =
    attachments.filter((attachment) => attachment.type === 'file').length > 0;

  // We don't want to allow users to remove the annotation in our
  // floating components (i.e. FloatingThreads, SelectionComments)
  // as it will result in the whole thread to disappear...
  const hideAnnotationAttachment = !isInSidebar;

  const threadResolved = thread?.resolved ?? false;
  const isReply = useMemo(() => (thread?.allMessagesCount ?? 0) > 0, [thread]);
  const withBorders = isReply || showBorder;
  const alwaysExpandComposer = composerValid || showExpanded;

  useEffect(() => {
    if (shouldFocusOnMount && !threadResolved) {
      ReactEditor.focus(editor);
    }
  }, [shouldFocusOnMount, editor, threadResolved]);

  useEffect(() => {
    if (editingMessageID) {
      EditorCommands.focusAndMoveCursorToEndOfText(editor);
    }
  }, [editingMessageID, editor]);

  useEffect(() => {
    setComposerExpanded(showExpanded || composerValid);
  }, [composerValid, showExpanded]);

  const getPlaceholder = useCallback(() => {
    if (isReply) {
      return t('reply_placeholder');
    }

    return t('send_message_placeholder');
  }, [isReply, t]);

  const cancelEdit = useCallback(() => {
    clearComposer();
  }, [clearComposer]);

  useClickOutside({
    onMouseDown: () => setComposerExpanded(false),
    elementRef: composerRef,
    disabled: alwaysExpandComposer,
    capture: true,
  });

  const showCloseButtonMode = showCloseButton && !composerExpanded;
  const showLargeButton = composerExpanded && size !== 'small';

  const sendButton = (
    <Button2
      additionalClassName={cx({
        [classes.sendButtonHidden]: showCloseButtonMode,
      })}
      buttonType={'primary'}
      size={'small'}
      disabled={!composerExpanded || !composerValid}
      onClick={sendMessage}
      cssVariablesOverride={{
        ...cssOverrideContext.composerSendButton,
        borderRadius: 'border-radius-round',
        height: showLargeButton
          ? 'space-2xl'
          : COMPOSER_COUPLED_CSS_VARS.height,
        padding: showLargeButton ? 'space-2xs' : 'space-3xs',
      }}
      icon={isInSidebar ? 'ArrowUp' : 'ArrowRight'}
    />
  );

  const handleClose = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      e.preventDefault();
      onClose?.();
      composerRef.current?.dispatchEvent(
        new CustomEvent<ComposerWebComponentEvents['close']>(
          `cord-composer:close`,
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
    [composerRef, onClose, thread, threadID, userByInternalID],
  );

  const closeButton = (
    <Button2
      additionalClassName={cx({
        [classes.closeButtonHidden]: showCloseButtonMode,
      })}
      buttonType={'secondary'}
      size={'small'}
      onMouseDown={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>
        handleClose(e)
      }
      cssVariablesOverride={{
        borderRadius: 'border-radius-round',
        height: showLargeButton
          ? 'space-2xl'
          : COMPOSER_COUPLED_CSS_VARS.height,
        padding: showLargeButton ? 'space-2xs' : 'space-3xs',
      }}
      icon={'X'}
    />
  );

  return (
    <>
      {editingMessageID && showEditingBanner && (
        <EditingMessageBanner cancelEdit={cancelEdit} />
      )}

      {threadResolved ? (
        <ResolvedThreadComposer
          forwardRef={composerRef}
          reopenThread={reopenThread}
        />
      ) : (
        <DragAndDropDiv
          onDrop={(e) => void onDrop(e)}
          forwardRef={containerRef}
          disabled={!enableAttachments}
          className={(classes.composerContainer, className)}
        >
          <Box2
            className={cx(classes.composerWrapper, {
              [classes.composerBorders]: withBorders,
              [classes.focused]: withBorders,
            })}
            backgroundColor={'base'}
            forwardRef={composerRef}
            paddingTop={'2xs'}
            paddingBottom={'2xs'}
          >
            <ComposerEditorWrapper
              // Sorry, need to fix something and this is separately triggering
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onSendOrEdit={sendMessage}
              updateTyping={updateTyping}
              editor={editor}
              userReferences={userReferences}
              menu={menu}
              menuVisible={menuVisible}
              closeMenu={closeMenu}
              slashMenu={slashMenu}
              composerExpanded={composerExpanded}
              placeholder={getPlaceholder()}
              size={size}
              setComposerExpanded={setComposerExpanded}
              sendButton={!composerExpanded ? sendButton : undefined}
              closeButton={showCloseButtonMode ? closeButton : undefined}
            />
            {hasFilesAttached && <ComposerFileAttachments2 />}
            {singleAnnotation && !hideAnnotationAttachment && (
              <AnnotationElement
                annotationAttachmentID={singleAnnotation.id}
                keepAnnotationInState={!!singleAnnotation}
              />
            )}
            {task && <ComposerTask />}
            {composerExpanded && (
              <>
                <ComposerMenu3
                  userReferenceMenuVisible={
                    userReferences.userReferenceMenuOpen
                  }
                  size={size}
                  sendButton={sendButton}
                  closeButton={showCloseButton ? closeButton : undefined}
                />
              </>
            )}
          </Box2>
        </DragAndDropDiv>
      )}
    </>
  );
});
