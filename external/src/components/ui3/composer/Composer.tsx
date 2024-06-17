import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ReactEditor } from 'slate-react';

import cx from 'classnames';
import { useCordTranslation } from '@cord-sdk/react';
import { DragAndDropDiv } from 'external/src/components/ui3/DragAndDropDiv.tsx';
import { useComposerController } from 'external/src/components/chat/composer/composerController.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { useThreadData } from 'external/src/components/2/hooks/useThreadData.ts';
import { useNewComposerAction2 } from 'external/src/components/2/hooks/useNewComposerAction2.ts';
import { ComposerTask } from 'external/src/components/chat/composer/ComposerTask.tsx';
import { ComposerFileAttachments } from 'external/src/components/ui3/composer/ComposerFileAttachments.tsx';
import { AnnotationElement } from 'external/src/components/chat/composer/annotations/AnnotationElement.tsx';
import { getSingleComposerAnnotation } from 'external/src/components/chat/composer/annotations/util.ts';
import { EditorCommands } from 'external/src/editor/commands.ts';
import type { ThreadData } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { GlobalElementContext } from 'external/src/context/globalElement/GlobalElementContext.ts';
import { ComposerContext } from 'external/src/context/composer/ComposerContext.ts';
import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';
import { ComposerEditor } from 'external/src/components/ui3/composer/ComposerEditor.tsx';
import { ResolvedThreadComposer } from 'external/src/components/ui3/ResolvedThreadComposer.tsx';
import { EditingMessageBanner } from 'external/src/components/2/EditingMessageBanner.tsx';
import { useClickOutside } from 'external/src/effects/useClickOutside.ts';
import { Button } from 'external/src/components/ui3/Button.tsx';
import { externalizeID } from 'common/util/externalIDs.ts';
import type { EntityMetadata, UUID } from 'common/types/index.ts';

import { ComposerMenu } from 'external/src/components/ui3/composer/ComposerMenu.tsx';
import * as classes from 'external/src/components/ui3/composer/Composer.classnames.ts';

import {
  sendButton as sendButtonClass,
  closeButton as closeButtonClass,
} from '@cord-sdk/react/components/helpers/Button.classnames.ts';
import {
  closeButtonHidden,
  sendButtonHidden,
} from 'external/src/components/ui3/composer/Composer.css.ts';
import { MODIFIERS } from 'common/ui/modifiers.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';
import type { ComposerWebComponentEvents } from '@cord-sdk/types';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { getThreadSummary } from 'common/util/convertToExternal/thread.ts';

const ARBITRARILY_SHORT_TIMEOUT_MS = 50;

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
  // Can we deprecate this?
  // It is only `false` when in a empty InlineThread where we show placeholder.
  // We can reproduce this with css.
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
  loading?: boolean;
  dispatchMessageEditEndEvent?: () => void;
};

export function Composer(props: ComposerProps) {
  const { t } = useCordTranslation('thread');
  const thread = useThreadData();
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);
  const showToastPopup =
    useContextThrowingIfNoProvider(GlobalElementContext)?.showToastPopup;
  const { threadID } = useContextThrowingIfNoProvider(Thread2Context);
  const { setResolved } = useContextThrowingIfNoProvider(ThreadsContext2);
  const composerControllerValue = useComposerController({
    isDraftThread: !thread,
    onSendMessage: props.onSendMessage,
    threadUrl: props.threadUrl,
    messageMetadata: props.messageMetadata,
    threadMetadata: props.threadMetadata,
    dispatchMessageEditEndEvent: props.dispatchMessageEditEndEvent,
    externalOrgID: thread?.externalOrgID ?? organization?.externalID,
    requestMentionableUsers: true,
  });
  const {
    byInternalID: { userByID: userByInternalID },
  } = useContextThrowingIfNoProvider(UsersContext);

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
                thread: thread && getThreadSummary(thread, userByInternalID),
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
}

const Composer3Component = React.memo(function Composer3Component({
  shouldFocusOnMount,
  disabled,
  size,
  editor,
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
  showExpanded = false,
  showCloseButton = false,
  onClose,
  showEditingBanner = true,
  className,
  loading,
  dispatchMessageEditEndEvent,
}: ComposerProps &
  ReturnType<typeof useComposerController> & {
    reopenThread: () => void;
    thread: ThreadData | null;
    threadID: UUID;
  }) {
  const { t } = useCordTranslation('composer');
  const singleAnnotation = useMemo(
    () => getSingleComposerAnnotation(attachments),
    [attachments],
  );
  const {
    byInternalID: { userByID: userByInternalID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const [composerExpanded, setComposerExpanded] =
    useState<boolean>(showExpanded);
  const [failedToSendMessage, setFailedToSendMessage] = useState(false);

  const { composerValid, composerEmpty } =
    useContextThrowingIfNoProvider(ComposerContext);
  const componentName = useContextThrowingIfNoProvider(ComponentContext)?.name;

  const isInSidebar = componentName === 'cord-sidebar';

  const hasFilesAttached =
    attachments.filter((attachment) => attachment.type === 'file').length > 0;

  // We don't want to allow users to remove the annotation in our
  // floating components (i.e. FloatingThreads, SelectionComments)
  // as it will result in the whole thread to disappear...
  const hideAnnotationAttachment = !isInSidebar;

  const threadResolved = thread?.resolved ?? false;
  const isReply = useMemo(() => (thread?.allMessagesCount ?? 0) > 0, [thread]);
  const alwaysExpandComposer = composerValid || !composerEmpty || showExpanded;

  useEffect(() => {
    if (shouldFocusOnMount && !threadResolved) {
      // If the composer re-renders after we .focus() it,
      // the focus is gone. This is undesirable. In some cases,
      // these re-renders are difficult to avoid: we create a thread,
      // we autofocus it, we add the metadata, thread re-renders and
      // focus is lost.
      // Wrap the `focus()` in a setTimeout to push it at the end
      // of the queue.
      setTimeout(() => ReactEditor.focus(editor), ARBITRARILY_SHORT_TIMEOUT_MS);
    }
  }, [shouldFocusOnMount, editor, threadResolved]);

  useEffect(() => {
    if (editingMessageID) {
      EditorCommands.focusAndMoveCursorToEndOfText(editor);
    }
  }, [editingMessageID, editor]);

  useEffect(() => {
    // Allow setComposerExpanded here even when `disabled` so that we pick up
    // changes in `showExpanded` prop.
    setComposerExpanded(showExpanded || !composerEmpty || composerValid);
  }, [composerValid, composerEmpty, showExpanded]);

  const getPlaceholder = useCallback(() => {
    if (isReply) {
      return t('reply_placeholder');
    }

    return t('send_message_placeholder');
  }, [isReply, t]);

  const cancelEdit = useCallback(() => {
    clearComposer();
    dispatchMessageEditEndEvent?.();
  }, [clearComposer, dispatchMessageEditEndEvent]);

  useClickOutside({
    onMouseDown: () => setComposerExpanded(false),
    elementRef: composerRef,
    disabled: alwaysExpandComposer || disabled,
    capture: true,
  });

  const showCloseButtonMode = showCloseButton && !composerExpanded;

  const handleSendMessage = useCallback(() => {
    void sendMessage().then(({ success }) => {
      setFailedToSendMessage(!success);
    });
  }, [sendMessage]);

  const sendButton = (
    <Button
      className={cx(sendButtonClass, {
        [sendButtonHidden]: showCloseButtonMode,
      })}
      buttonAction="send-message"
      buttonType="primary"
      size="small"
      disabled={disabled || loading || !composerExpanded || !composerValid}
      onClick={handleSendMessage}
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
    <Button
      className={cx(closeButtonClass, {
        [closeButtonHidden]: showCloseButtonMode,
      })}
      buttonAction="close-composer"
      buttonType="secondary"
      size="small"
      onMouseDown={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>
        handleClose(e)
      }
      icon="X"
    />
  );

  return (
    <>
      {editingMessageID && showEditingBanner && (
        <EditingMessageBanner cancelEdit={cancelEdit} />
      )}
      {failedToSendMessage && (
        <div className={classes.composerErrorMessage}>
          {t('send_message_action_failure')}
        </div>
      )}
      {threadResolved ? (
        <ResolvedThreadComposer
          forwardRef={composerRef}
          reopenThread={reopenThread}
        />
      ) : (
        <DragAndDropDiv
          onDrop={(e) => void onDrop(e)}
          forwardRef={composerRef}
          disabled={!enableAttachments}
          className={cx(classes.composerContainer, className, {
            [classes.small]: size === 'small',
            [classes.medium]: size === 'medium' || size === undefined,
            [classes.large]: size === 'large',
            [classes.expanded]: composerExpanded,
            [classes.valid]: composerValid && !loading,
            [classes.empty]: composerEmpty,
            [MODIFIERS.error]: failedToSendMessage,
            [MODIFIERS.disabled]: disabled,
          })}
        >
          <ComposerEditor
            onSendOrEdit={handleSendMessage}
            updateTyping={updateTyping}
            editor={editor}
            userReferences={userReferences}
            menu={menu}
            menuVisible={menuVisible}
            closeMenu={closeMenu}
            slashMenu={slashMenu}
            placeholder={getPlaceholder()}
            size={size}
            setComposerExpanded={disabled ? undefined : setComposerExpanded}
            dispatchMessageEditEndEvent={dispatchMessageEditEndEvent}
            disabled={disabled}
          />
          {hasFilesAttached && <ComposerFileAttachments />}
          {singleAnnotation && !hideAnnotationAttachment && (
            <AnnotationElement
              annotationAttachmentID={singleAnnotation.id}
              keepAnnotationInState={!!singleAnnotation}
            />
          )}
          {task && <ComposerTask />}
          <ComposerMenu
            disabled={disabled}
            userReferenceMenuVisible={userReferences.userReferenceMenuOpen}
            sendButton={sendButton}
            closeButton={showCloseButton ? closeButton : undefined}
          />
        </DragAndDropDiv>
      )}
    </>
  );
});

export const newComposerConfig = {
  NewComp: Composer,
  configKey: 'composer',
} as const;
