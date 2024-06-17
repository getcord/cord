import { useCallback } from 'react';
import { ReactEditor } from 'slate-react';
import cx from 'classnames';

import { useCordTranslation } from '@cord-sdk/react';
import { EmbedContext } from 'external/src/context/embed/EmbedContext.ts';
import { useComposerActions } from 'external/src/components/chat/composer/hooks/useComposerActions.ts';
import { EditorCommands } from 'external/src/editor/commands.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { Button } from 'external/src/components/ui3/Button.tsx';
import { WithTooltip } from 'external/src/components/ui3/WithTooltip.tsx';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { useEmojiPicker } from 'external/src/components/ui3/EmojiPicker.tsx';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { getSingleComposerAnnotation } from 'external/src/components/chat/composer/annotations/util.ts';
import { ComposerContext } from 'external/src/context/composer/ComposerContext.ts';

import * as classes from 'external/src/components/ui3/composer/Composer.classnames.ts';
import 'external/src/components/ui3/composer/ComposerMenu.css';
import { MODIFIERS } from 'common/ui/modifiers.ts';

type Props = {
  disabled?: boolean;
  userReferenceMenuVisible?: boolean;
  sendButton: JSX.Element;
  closeButton?: JSX.Element;
};

export function ComposerMenu({
  disabled,
  userReferenceMenuVisible,
  sendButton,
  closeButton,
}: Props) {
  const { t } = useCordTranslation('composer');
  const { logEvent } = useLogger();

  const {
    editor,
    getSelection,
    composerEmpty,
    state: { task, attachments },
  } = useContextThrowingIfNoProvider(ComposerContext);
  const { location } = useContextThrowingIfNoProvider(ThreadsContext2);

  const singleAnnotation = getSingleComposerAnnotation(attachments);

  const { supportsAnnotations } = useContextThrowingIfNoProvider(EmbedContext);
  const { enableAnnotations, enableTasks } =
    useContextThrowingIfNoProvider(ConfigurationContext);

  const showAnnotationsButton =
    supportsAnnotations && enableAnnotations && location !== 'inbox';
  const enableAttachments = useFeatureFlag(FeatureFlags.ENABLE_ATTACHMENTS);

  const { createAnnotation, startAttachFlow, addTask, removeTask } =
    useComposerActions();

  const handleAddAtCharacter = useCallback(() => {
    logEvent('click-mention-button-composer');
    const selection = getSelection();
    EditorCommands.addText(editor, selection, composerEmpty ? '@' : ' @');
  }, [composerEmpty, editor, getSelection, logEvent]);

  const handleAddEmoji = useCallback(
    (emoji: string) => {
      const selection = getSelection();
      EditorCommands.addEmoji(editor, selection, emoji);
    },
    [editor, getSelection],
  );
  const { EmojiPicker } = useEmojiPicker(
    <WithTooltip label={t('add_emoji_tooltip')} tooltipDisabled={disabled}>
      <Button
        disabled={disabled}
        buttonType="tertiary"
        size="medium"
        icon="Smiley"
        buttonAction="select-emoji"
      />
    </WithTooltip>,
    handleAddEmoji,
  );

  const isTaskActive = Boolean(task);

  return (
    <div className={classes.composerButtonsContainer}>
      <div className={classes.secondaryButtonsGroup}>
        {showAnnotationsButton && (
          <WithTooltip
            label={singleAnnotation ? t('replace_annotation_tooltip') : null}
            tooltipDisabled={disabled || !singleAnnotation}
          >
            <Button
              buttonAction="create-annotation"
              buttonType="secondary"
              size="medium"
              icon="AnnotationPin"
              disabled={disabled}
              onClick={createAnnotation}
              className={cx({ [MODIFIERS.active]: singleAnnotation !== null })}
            >
              {t('annotate_action')}
            </Button>
          </WithTooltip>
        )}
        <WithTooltip
          label={t('mention_someone_tooltip')}
          tooltipDisabled={disabled || userReferenceMenuVisible}
        >
          <Button
            buttonType="tertiary"
            buttonAction="add-mention"
            size="medium"
            icon="At"
            onClick={handleAddAtCharacter}
            disabled={disabled || userReferenceMenuVisible}
          />
        </WithTooltip>
        {EmojiPicker}
        {enableTasks && (
          <WithTooltip
            label={t(
              isTaskActive ? 'remove_task_tooltip' : 'create_task_tooltip',
            )}
            tooltipDisabled={disabled}
          >
            <Button
              buttonType={isTaskActive ? 'secondary' : 'tertiary'}
              buttonAction="add-task"
              size="medium"
              icon="Clipboard"
              onClick={isTaskActive ? removeTask : addTask}
              className={cx({ [MODIFIERS.active]: isTaskActive })}
              disabled={disabled}
            />
          </WithTooltip>
        )}
        {enableAttachments && (
          <WithTooltip
            label={t('attach_file_tooltip')}
            tooltipDisabled={disabled}
          >
            <Button
              buttonType="tertiary"
              buttonAction="add-attachment"
              size="medium"
              icon="Paperclip"
              onClick={() => {
                startAttachFlow();
                ReactEditor.focus(editor);
              }}
              disabled={disabled}
            />
          </WithTooltip>
        )}
      </div>
      <div className={classes.primaryButtonsGroup}>
        {closeButton}
        {sendButton}
      </div>
    </div>
  );
}
