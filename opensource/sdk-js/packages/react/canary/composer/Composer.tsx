import * as React from 'react';
import isHotkey from 'is-hotkey';
import cx from 'classnames';
import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ReactEditor } from 'slate-react';
import type {
  ClientMessageData,
  MessageAttachment,
  MessageContent,
} from '@cord-sdk/types';
import * as buttonClasses from '../../components/helpers/Button.classnames.js';
import withCord from '../../experimental/components/hoc/withCord.js';
import { Keys } from '../../common/const/Keys.js';

import type {
  ComposerMessageData,
  ComposerProps,
  CordComposerProps,
  EditComposerProps,
  SendComposerProps,
} from '../../experimental/types.js';
import { ReactionPickButton, Replace } from '../../betaV2.js';
import { WithPopper } from '../../experimental/components/helpers/WithPopper.js';
import {
  CordContext,
  thread as ThreadSDK,
  useCordTranslation,
} from '../../index.js';
import { isMessageFileAttachment } from '../../common/lib/isMessageFileAttachment.js';
import { throttle } from '../../common/lib/throttle.js';
import { onDeleteOrBackspace } from './event-handlers/onDeleteOrBackspace.js';
import { onSpace } from './event-handlers/onSpace.js';
import { onInlineModifier } from './event-handlers/onInlineModifier.js';
import { onArrow } from './event-handlers/onArrowPress.js';
import { onTab } from './event-handlers/onTab.js';
import { onShiftEnter } from './event-handlers/onShiftEnter.js';
import { EditorCommands, HOTKEYS } from './lib/commands.js';
import { useAddAttachmentToComposer } from './hooks/useAttachments.js';
import { TextEditor, useTextEditor } from './TextEditor.js';
import type { UseTextEditorProps } from './TextEditor.js';
import { ComposerLayout } from './ComposerLayout.js';
import { ResolvedThreadComposer } from './ResolvedThreadComposer.js';
import { useCreateSubmit, useEditSubmit } from './hooks/useSubmit.js';
import { useAddMentionToComposer } from './hooks/useMentionList.js';
import { SendButton } from './SendButton.js';
import { CloseComposerButton } from './CloseComposerButton.js';
import classes from './Composer.css.js';
import { SendMessageError } from './SendMessageError.js';
import { ToolbarLayoutWithClassName } from './ToolbarLayout.js';

// Typing indicator will last 3 sec if not set again, so throttling with 1s interval is OK.
// We could make it closer to 3sec, but this could cause the typing to be set to false, despite user still typing if network is slow.
// 1sec already reduce the load a lot, and give 2sec grace period for the network.
const SET_TYPING_THROTTLE_MS = 1000;

export function useEditComposer(props: EditComposerProps): ComposerProps {
  const onSubmit = useEditSubmit(props);

  const messageData = ThreadSDK.useMessage(props.messageID);
  const threadData = ThreadSDK.useThread(messageData?.threadID, {
    skip: !messageData?.threadID,
  });

  return useCordComposer({
    ...props,
    showCancelButton: props.showCancelButton ?? true,
    onSubmit,
    groupID: threadData.thread?.groupID,
  });
}

function useToolbarItems(
  cordComposerProps: ComposerProps,
  onCancel: ComposerProps['onCancel'],
) {
  return useMemo(() => {
    if (!cordComposerProps.showCancelButton) {
      return cordComposerProps.toolbarItems;
    }

    return [
      ...(cordComposerProps.toolbarItems ?? []),
      {
        name: 'cancelButton',
        element: <CloseComposerButton canBeReplaced onClick={onCancel} />,
      },
    ];
  }, [
    cordComposerProps.showCancelButton,
    cordComposerProps.toolbarItems,
    onCancel,
  ]);
}

export function useSendComposer(props: SendComposerProps): ComposerProps {
  const onSubmit = useCreateSubmit(props);

  const { threadID } = props;
  const { thread: threadData } = ThreadSDK.useThread(threadID, {
    skip: !threadID,
  });
  const { sdk: cord } = useContext(CordContext);
  // lint is not happy not knowing the dependency of the function return by throttle. So we use `useMemo` instead.
  const throttledSetTyping = useMemo(
    () =>
      throttle({ interval: SET_TYPING_THROTTLE_MS }, () => {
        if (!threadID || !cord) {
          return;
        }
        void cord?.thread.updateThread(threadID, {
          typing: true,
        });
      }),
    [threadID, cord],
  );
  const onChange = useCallback(() => {
    throttledSetTyping();
  }, [throttledSetTyping]);

  return useCordComposer({
    ...props,
    showCancelButton: props.showCancelButton ?? false,
    onSubmit,
    onChange,
    groupID: threadData?.groupID ?? props.createThread?.groupID,
  });
}

export const SendComposer = forwardRef(
  (
    { replace, ...restProps }: SendComposerProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) => {
    const threadData = ThreadSDK.useThread(restProps.threadID, {
      skip: !restProps.threadID,
    });
    const resolved = threadData.thread?.resolved;
    const { t } = useCordTranslation('composer');

    const cordComposerProps = useSendComposer(restProps);

    const toolbarItems = useToolbarItems(cordComposerProps, restProps.onCancel);

    if (resolved) {
      return (
        <Replace replace={replace}>
          <ResolvedThreadComposer thread={threadData} canBeReplaced />
        </Replace>
      );
    }

    return (
      <Replace replace={replace}>
        <Composer
          ref={ref}
          canBeReplaced
          placeholder={t('send_message_placeholder')}
          {...cordComposerProps}
          toolbarItems={toolbarItems}
        />
      </Replace>
    );
  },
);

export const EditComposer = forwardRef(
  (
    { replace, ...restProps }: EditComposerProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) => {
    const message = ThreadSDK.useMessage(restProps.messageID);
    const threadID = message?.threadID;
    const threadData = ThreadSDK.useThread(threadID, { skip: !threadID });
    const resolved = threadData.thread?.resolved;

    const { t } = useCordTranslation('composer');

    const cordComposerProps = useEditComposer(restProps);
    const toolbarItems = useToolbarItems(cordComposerProps, restProps.onCancel);

    if (resolved) {
      return (
        <Replace replace={replace}>
          <ResolvedThreadComposer thread={threadData} canBeReplaced />
        </Replace>
      );
    }

    return (
      <Replace replace={replace}>
        <Composer
          ref={ref}
          canBeReplaced
          placeholder={t('edit_message_placeholder')}
          {...cordComposerProps}
          toolbarItems={toolbarItems}
        />
      </Replace>
    );
  },
);

export function useCordComposer(props: CordComposerProps): ComposerProps {
  const {
    onSubmit,
    initialValue,
    onAfterSubmit,
    onBeforeSubmit,
    groupID,
    onFailSubmit,
    expanded = 'always',
  } = props;

  const base = useBaseComposer({
    ...props,
    initialValue: props.initialValue?.content,
  });

  const { editor, isEmpty } = base;
  const initialMessageFileAttachments = useMemo(
    () => initialValue?.attachments?.filter(isMessageFileAttachment) ?? [],
    [initialValue?.attachments],
  );
  const attachmentsProps = useAddAttachmentToComposer({
    initialAttachments: initialMessageFileAttachments,
    editor,
  });
  const mentionProps = useAddMentionToComposer({
    editor,
    isEmpty,
    groupID,
  });

  const onChange = useCallback(
    (args: { content: MessageContent }) => {
      props.onChange?.(args);
      base.onChange(args);
      mentionProps.onChange(args);
    },
    [base, mentionProps, props],
  );

  const onKeyDown = useCallback(
    (args: { event: React.KeyboardEvent }) => {
      const prevent = mentionProps.onKeyDown?.(args);
      if (prevent) {
        return prevent;
      }
      return base.onKeyDown(args);
    },
    [base, mentionProps],
  );

  const onPaste = useCallback(
    (args: { event: React.ClipboardEvent }) => {
      attachmentsProps.onPaste?.(args);
      base.onPaste(args);
    },
    [base, attachmentsProps],
  );

  const extraChildren = useMemo(
    () => [
      ...(attachmentsProps.extraChildren ?? []),
      ...(base.extraChildren ?? []),
    ],
    [attachmentsProps.extraChildren, base.extraChildren],
  );

  const toolbarItems = useMemo(
    () => [
      ...(mentionProps.toolbarItems ?? []),
      ...(attachmentsProps.toolbarItems ?? []),
      ...(base.toolbarItems ?? []),
    ],
    [
      base.toolbarItems,
      mentionProps.toolbarItems,
      attachmentsProps.toolbarItems,
    ],
  );

  const value = useMemo(
    () =>
      ({
        attachments: attachmentsProps.attachments as MessageAttachment[],
      }) satisfies ComposerMessageData,
    [attachmentsProps.attachments],
  );

  const isValid = base.isValid || attachmentsProps.isValid;

  const onSubmitWithBeforeAndAfter = useCallback(
    async (args: { message: ComposerMessageData }) => {
      let message: null | ComposerMessageData = args.message;
      if (!isValid) {
        return;
      }
      if (onBeforeSubmit) {
        message = (await onBeforeSubmit({ message }))?.message ?? null;
        if (message === null) {
          return;
        }
      }
      await onSubmit({ message });
      onAfterSubmit?.({ message });
    },
    [isValid, onBeforeSubmit, onSubmit, onAfterSubmit],
  );

  const onResetState = useCallback(
    (newValue?: MessageContent) => {
      const previous = base.onResetState(newValue);
      attachmentsProps.onResetState();
      return previous;
    },
    [base, attachmentsProps],
  );

  return {
    ...base,
    expanded,
    extraChildren,
    isValid,
    toolbarItems,
    onSubmit: onSubmitWithBeforeAndAfter,
    editor: mentionProps.editor,
    onChange,
    onResetState,
    onKeyDown,
    isEmpty,
    onPaste,
    popperElement: mentionProps.popperElement,
    popperElementVisible: mentionProps.popperElementVisible,
    popperOnShouldHide: mentionProps.popperOnShouldHide,
    initialValue,
    value,
    groupID,
    onFailSubmit,
    attachmentInputElement: attachmentsProps.attachmentInputElement,
    attachFilesToComposer: attachmentsProps.attachFilesToComposer,
  };
}
export function useBaseComposer(
  props: UseTextEditorProps,
): Omit<
  ComposerProps,
  | 'onSubmit'
  | 'groupID'
  | 'expanded'
  | 'attachmentInputElement'
  | 'attachFilesToComposer'
  | 'enableDragDropAttachments'
> {
  const simpleComposer = useTextEditor(props);
  const { editor } = simpleComposer;
  const onKeyDown = useCallback(
    ({ event }: { event: React.KeyboardEvent }) => {
      for (const hotkey in HOTKEYS) {
        if (isHotkey.default(hotkey, event)) {
          event.preventDefault();
          const mark = HOTKEYS[hotkey];
          EditorCommands.toggleMark(editor, mark);
          return;
        }
      }

      // Debug dump
      if (isHotkey.default('ctrl+shift+d', event as any)) {
        event.preventDefault();
        // eslint-disable-next-line no-console
        console.log('Editor content:', editor.children);
        return;
      }

      if (event.key === Keys.SPACEBAR) {
        onSpace(editor, event);
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
        }
      }

      if (event.key === Keys.TAB) {
        onTab(editor, event);
      }

      if (event.key === Keys.ESCAPE) {
        ReactEditor.blur(editor);
        // [ONI]-TODO handle stop editing
        // likely call onBlur from props
      }
    },
    [editor],
  );

  const value = useMemo(
    () => ({}) satisfies Omit<ComposerMessageData, 'content'>,
    [],
  );
  const initialValue = useMemo(
    () =>
      ({
        content: simpleComposer.initialValue,
      }) satisfies Partial<ClientMessageData>,
    [simpleComposer.initialValue],
  );

  return {
    ...simpleComposer,
    onKeyDown,
    initialValue,
    value,
    onPaste: () => {},
  };
}

type ComposerContextType = Pick<ComposerProps, 'attachFilesToComposer'> & {
  insertEmoji: (emoji: string) => void;
};

export const ComposerContext = React.createContext<ComposerContextType | null>(
  null,
);

export const Composer = withCord<React.PropsWithChildren<ComposerProps>>(
  forwardRef(function Composer(
    props: ComposerProps,
    ref: React.ForwardedRef<HTMLElement>,
  ) {
    const {
      editor,
      initialValue,
      value,
      onSubmit,
      onCancel,
      onResetState,
      isValid,
      onKeyDown,
      toolbarItems,
      autofocus,
      extraChildren,
      onFailSubmit,
      ...rest
    } = props;
    const insertEmoji = useCallback(
      (emoji: string) => {
        EditorCommands.addEmoji(editor, editor.selection, emoji);
      },
      [editor],
    );

    const [restoreMessage, onSubmitWithErrorHandling] =
      useSubmitWithErrorHandling({
        onSubmit,
        onResetState,
        onFailSubmit,
      });

    const failSubmitMessageExtraChildren = useMemo(() => {
      return restoreMessage
        ? [
            {
              name: 'failSubmitMessage',
              element: <SendMessageError restoreMessage={restoreMessage} />,
            },
          ]
        : [];
    }, [restoreMessage]);

    const extraChildrenWithDefault = useMemo(
      () => [...(extraChildren ?? []), ...failSubmitMessageExtraChildren],
      [extraChildren, failSubmitMessageExtraChildren],
    );

    useEffect(() => {
      if (autofocus) {
        EditorCommands.focusAndMoveCursorToEndOfText(editor);
      }
    }, [editor, autofocus]);

    const toolbarItemsWithDefault = useMemo(() => {
      return [
        ...(toolbarItems ?? []),
        {
          name: 'addEmoji',
          element: (
            <ReactionPickButton
              key="add-emoji-button"
              canBeReplaced
              className={buttonClasses.colorsTertiary}
              onReactionClick={insertEmoji}
            />
          ),
        },
        {
          name: 'sendButton',
          element: (
            <SendButton
              key="send-button"
              onClick={() =>
                onSubmitWithErrorHandling({
                  ...initialValue,
                  ...value,
                  content: editor.children,
                })
              }
              canBeReplaced
              disabled={!isValid}
            />
          ),
        },
      ];
    }, [
      toolbarItems,
      insertEmoji,
      isValid,
      onSubmitWithErrorHandling,
      initialValue,
      value,
      editor.children,
    ]);

    const onKeyDownWithSubmitAndCancel = useCallback(
      (arg: { event: React.KeyboardEvent }) => {
        const preventDefault = onKeyDown(arg);
        if (preventDefault) {
          return true;
        }
        const { event } = arg;
        if (event.key === Keys.ENTER) {
          if (!event.shiftKey) {
            event.preventDefault();
            if (!isValid) {
              return true;
            }

            onSubmitWithErrorHandling({
              ...initialValue,
              ...value,
              content: editor.children,
            });
          }
        }
        if (event.key === Keys.ESCAPE) {
          return onCancel?.();
        }
        return false;
      },
      [
        onKeyDown,
        isValid,
        onSubmitWithErrorHandling,
        initialValue,
        value,
        editor.children,
        onCancel,
      ],
    );

    const contextValue: ComposerContextType = useMemo(() => {
      return {
        attachFilesToComposer: props.attachFilesToComposer,
        insertEmoji,
      };
    }, [insertEmoji, props.attachFilesToComposer]);

    return (
      <ComposerContext.Provider value={contextValue}>
        <BaseComposer
          ref={ref}
          {...rest}
          isValid={isValid}
          extraChildren={extraChildrenWithDefault}
          editor={editor}
          onKeyDown={onKeyDownWithSubmitAndCancel}
          toolbarItems={toolbarItemsWithDefault}
          initialValue={initialValue}
        />
      </ComposerContext.Provider>
    );
  }),
  'Composer',
);

// We remove 'value, because it is in `editor.children`, no need to have more than one source of truth
// There is no send button, and no submit on enter, in the BaseComposer.
type BaseComposerProps = Omit<
  ComposerProps,
  'onSubmit' | 'onResetState' | 'value'
>;

const BaseComposer = forwardRef(function BaseComposer(
  {
    placeholder,
    editor,
    initialValue,
    onPaste,
    onKeyDown,
    onChange,
    toolbarItems,
    extraChildren,
    popperElement,
    popperElementVisible,
    popperOnShouldHide,
    className,
    style,
    isEmpty,
    isValid,
    expanded,
    'data-cord-replace': dataCordReplace,
    attachmentInputElement,
    attachFilesToComposer,
    enableDragDropAttachments = true,
  }: BaseComposerProps,
  ref: React.ForwardedRef<HTMLElement>,
) {
  return (
    <>
      <WithPopper
        popperElement={popperElement ?? null}
        popperElementVisible={popperElementVisible ?? false}
        popperPosition="top-start"
        onShouldHide={popperOnShouldHide}
        popperWidth="full"
      >
        <ComposerLayout
          ref={ref}
          className={cx(className, classes.composerContainer, {
            [classes.alwaysExpand]: expanded === 'always',
            [classes.neverExpand]: expanded === 'never',
            [classes.autoExpand]: expanded === 'auto',
            [classes.hasAttachments]: !!extraChildren?.find(
              (c) => c.name === 'attachments',
            )?.element,
            [classes.empty]: isEmpty,
            [classes.valid]: isValid,
          })}
          canBeReplaced
          ToolbarLayoutComp={ToolbarLayoutWithClassName}
          textEditor={
            <TextEditor
              canBeReplaced
              className={classes.editor}
              placeholder={placeholder}
              editor={editor}
              initialValue={initialValue?.content}
              onPaste={onPaste}
              onChange={onChange}
              onKeyDown={onKeyDown}
            />
          }
          extraChildren={extraChildren}
          toolbarItems={toolbarItems}
          style={style}
          isEmpty={isEmpty}
          isValid={isValid}
          data-cord-replace={dataCordReplace}
          attachFilesToComposer={attachFilesToComposer}
          enableDragDropAttachments={enableDragDropAttachments}
        />
      </WithPopper>
      {attachmentInputElement}
    </>
  );
});

/**
 * Clear the editor state and send the message, returning a message restoration
 * function and calling the error handler if there's an error.
 */
function useSubmitWithErrorHandling({
  onSubmit,
  onResetState,
  onFailSubmit,
}: Pick<ComposerProps, 'onSubmit' | 'onResetState' | 'onFailSubmit'>): [
  (() => void) | undefined,
  (message: Partial<ClientMessageData>) => void,
] {
  const [restoreMessage, setRestoreMessage] = useState<() => void>();

  const onSubmitWithErrorHandling = useCallback(
    async (message: Partial<ClientMessageData>) => {
      const previous = onResetState();
      try {
        await onSubmit({ message });
      } catch (err) {
        setRestoreMessage(() => () => {
          onResetState(previous);
          setRestoreMessage(undefined);
        });
        if (onFailSubmit) {
          onFailSubmit(err);
        } else {
          console.error('Failed to send message:', err);
        }
      }
    },
    [onFailSubmit, onResetState, onSubmit],
  );

  return [restoreMessage, onSubmitWithErrorHandling];
}
