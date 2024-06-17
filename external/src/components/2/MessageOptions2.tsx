import { useCallback, useMemo, useState } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { useCordTranslation } from '@cord-sdk/react';
import type { MessageFragment } from 'external/src/graphql/operations.ts';
import type { UUID } from 'common/types/index.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { useEmojiPicker2 } from 'external/src/components/ui2/EmojiPicker2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { isUserAuthorOfMessage } from 'external/src/lib/util.ts';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { ENABLE_MESSAGE_DEBUG } from 'common/const/UserPreferenceKeys.ts';
import { usePreference } from 'external/src/effects/usePreference.ts';
import { OptionsMenu } from 'external/src/components/2/OptionsMenu.tsx';
import { isViewerPreviouslyAddedReaction } from 'external/src/components/util.ts';

const useStyles = createUseStyles({
  messageOptionsButtons: {
    gap: cssVar('space-3xs'),
    background: 'transparent',
    borderRadius: cssVar('space-3xs'),
    paddingTop: cssVar('space-3xs'),
  },
  vertical: {
    // When stacked vertically, we want the emoji picker to be below the optionsMenu
    flexDirection: 'column-reverse',
    paddingTop: 'unset',
  },
});

type Props = {
  threadID: UUID;
  message: MessageFragment;
  messageIsHighlighted: boolean;
  getClassName?: (menuVisible: boolean) => string;
  showThreadOptions: boolean;
  showMessageOptions: boolean;
  orientation?: 'horizontal' | 'vertical';
};

/**
 * @deprecated Use ui3/MessageOptions instead
 */
export function MessageOptions2({
  threadID,
  message,
  getClassName,
  showThreadOptions,
  showMessageOptions,
  orientation = 'horizontal',
}: Props) {
  const { t } = useCordTranslation('message');
  const classes = useStyles();

  const [messageDebugEnabled] = usePreference(ENABLE_MESSAGE_DEBUG);

  const { user } = useContextThrowingIfNoProvider(IdentityContext);
  const viewerIsAuthorOfMessage = isUserAuthorOfMessage(
    message,
    user?.externalID,
  );

  const { addReaction, removeReaction } =
    useContextThrowingIfNoProvider(ThreadsContext2);

  const onReactionButtonClicked = useCallback(
    (unicodeReaction: string) => {
      isViewerPreviouslyAddedReaction(
        user?.id,
        message.reactions,
        unicodeReaction,
      )
        ? removeReaction(threadID, message, unicodeReaction)
        : addReaction(threadID, message.id, unicodeReaction);
    },
    [addReaction, message, removeReaction, user?.id, threadID],
  );

  const { EmojiPicker, emojiPickerVisible } = useEmojiPicker2(
    <WithTooltip2 label={t('add_reaction_action')}>
      <Button2 buttonType={'secondary'} size={'small'} icon={'AddEmoji'} />
    </WithTooltip2>,
    onReactionButtonClicked,
  );

  const [menuShowing, setMenuShowing] = useState(false);

  const showOptionsButton = useMemo(() => {
    if (messageDebugEnabled) {
      return true;
    }
    // The message is written by the author and we don't want to explicity
    // hide the message options for the author
    if (
      viewerIsAuthorOfMessage &&
      message.importedSlackMessageType !== 'reply' &&
      !message.isFromEmailReply &&
      showMessageOptions
    ) {
      return true;
    }

    if (showThreadOptions) {
      return true;
    }

    return false;
  }, [
    message.importedSlackMessageType,
    message.isFromEmailReply,
    messageDebugEnabled,
    showMessageOptions,
    showThreadOptions,
    viewerIsAuthorOfMessage,
  ]);

  return (
    <Row2
      className={cx(
        classes.messageOptionsButtons,
        getClassName?.(menuShowing || emojiPickerVisible),
        {
          [classes.vertical]: orientation === 'vertical',
        },
      )}
    >
      {EmojiPicker}
      {showOptionsButton && (
        <OptionsMenu
          threadID={threadID}
          button={
            <WithTooltip2 label={t('message_options_tooltip')}>
              <Button2
                icon="DotsThree"
                buttonType={'secondary'}
                size={'small'}
              />
            </WithTooltip2>
          }
          showThreadOptions={!!showThreadOptions}
          showMessageOptions={showMessageOptions}
          message={message}
          setMenuShowing={setMenuShowing}
        />
      )}
    </Row2>
  );
}
