import { useCallback } from 'react';
import { createUseStyles } from 'react-jss';
import { ReactEditor } from 'slate-react';
import cx from 'classnames';

import { useCordTranslation } from '@cord-sdk/react';
import { EmbedContext } from 'external/src/context/embed/EmbedContext.ts';
import { useComposerActions } from 'external/src/components/chat/composer/hooks/useComposerActions.ts';
import { EditorCommands } from 'external/src/editor/commands.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { ButtonGroup2 } from 'external/src/components/ui2/ButtonGroup2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { useEmojiPicker2 } from 'external/src/components/ui2/EmojiPicker2.tsx';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { getSingleComposerAnnotation } from 'external/src/components/chat/composer/annotations/util.ts';
import { ComposerContext } from 'external/src/context/composer/ComposerContext.ts';
import type { ComposerHeight } from 'external/src/components/2/Composer3.tsx';

const useStyles = createUseStyles({
  composerButtonsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: `0 ${cssVar('space-2xs')}`,
  },
  withBorder: {
    padding: `${cssVar('space-2xs')} ${cssVar('space-2xs')} ${cssVar(
      'space-none',
    )}`,
    borderTop: `1px solid ${cssVar('color-base-x-strong')}`,
  },
  active: {
    backgroundColor: cssVar('secondary-button-background-color--hover'),
    color: cssVar('secondary-button-content-color--hover'),
  },
});

type Props = {
  userReferenceMenuVisible?: boolean;
  sendButton: JSX.Element;
  size?: ComposerHeight;
  closeButton?: JSX.Element;
};

/**
 * @deprecated Use ui3/ComposerMenu3 instead
 */
export function ComposerMenu3({
  userReferenceMenuVisible,
  sendButton,
  size,
  closeButton,
}: Props) {
  const { t } = useCordTranslation('composer');
  const classes = useStyles();
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

  const buttonIconSize = size === 'small' ? 'small' : 'medium';

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
  const { EmojiPicker } = useEmojiPicker2(
    <WithTooltip2 label={t('add_emoji_tooltip')}>
      <Button2 buttonType={'tertiary'} size={buttonIconSize} icon={'Smiley'} />
    </WithTooltip2>,
    handleAddEmoji,
  );

  const isTaskActive = Boolean(task);

  return (
    <Box2
      className={cx([classes.composerButtonsContainer], {
        [classes.withBorder]: size !== 'small',
      })}
    >
      <ButtonGroup2>
        {showAnnotationsButton && (
          <WithTooltip2
            label={singleAnnotation ? t('replace_annotation_tooltip') : null}
            tooltipDisabled={!singleAnnotation}
          >
            <Button2
              buttonType={'secondary'}
              size={buttonIconSize}
              icon={'AnnotationPin'}
              onClick={createAnnotation}
              additionalClassName={
                singleAnnotation !== null ? classes.active : undefined
              }
            >
              {t('annotate_action')}
            </Button2>
          </WithTooltip2>
        )}
        <WithTooltip2
          label={t('mention_someone_tooltip')}
          tooltipDisabled={userReferenceMenuVisible}
        >
          <Button2
            buttonType={'tertiary'}
            size={buttonIconSize}
            icon={'At'}
            onClick={handleAddAtCharacter}
            disabled={userReferenceMenuVisible}
          />
        </WithTooltip2>
        {EmojiPicker}
        {enableTasks && (
          <WithTooltip2
            label={t(
              isTaskActive ? 'remove_task_tooltip' : 'create_task_tooltip',
            )}
          >
            <Button2
              buttonType={isTaskActive ? 'secondary' : 'tertiary'}
              size={buttonIconSize}
              icon="Clipboard"
              onClick={isTaskActive ? removeTask : addTask}
              additionalClassName={isTaskActive ? classes.active : undefined}
            />
          </WithTooltip2>
        )}
        {enableAttachments && (
          <WithTooltip2 label={t('attach_file_tooltip')}>
            <Button2
              buttonType={'tertiary'}
              size={buttonIconSize}
              icon={'Paperclip'}
              onClick={() => {
                startAttachFlow();
                ReactEditor.focus(editor);
              }}
            />
          </WithTooltip2>
        )}
      </ButtonGroup2>
      <ButtonGroup2>
        {closeButton ?? false}
        {sendButton}
      </ButtonGroup2>
    </Box2>
  );
}
