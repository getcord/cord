import type { RefObject } from 'react';
import { useCallback, useMemo, useState } from 'react';
import cx from 'classnames';
import { useCordTranslation } from '@cord-sdk/react';
import * as classes from 'external/src/components/ui3/MessageOptions.css.ts';

import type { MessageFragment } from 'external/src/graphql/operations.ts';
import type { UUID } from 'common/types/index.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { useEmojiPicker } from 'external/src/components/ui3/EmojiPicker.tsx';
import { Button } from 'external/src/components/ui3/Button.tsx';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { isUserAuthorOfMessage } from 'external/src/lib/util.ts';
import { WithTooltip } from 'external/src/components/ui3/WithTooltip.tsx';
import { ENABLE_MESSAGE_DEBUG } from 'common/const/UserPreferenceKeys.ts';
import { usePreference } from 'external/src/effects/usePreference.ts';
import { OptionsMenu } from 'external/src/components/ui3/OptionsMenu.tsx';
import { isViewerPreviouslyAddedReaction } from 'external/src/components/util.ts';
import { MODIFIERS } from 'common/ui/modifiers.ts';

type Props = {
  threadID: UUID;
  message: MessageFragment;
  messageIsHighlighted: boolean;
  getClassName?: (menuVisible: boolean) => string;
  showThreadOptions: boolean;
  showMessageOptions: boolean;
  orientation?: 'horizontal' | 'vertical';
  messageRef?: RefObject<HTMLDivElement>;
};

export function MessageOptions({
  threadID,
  message,
  getClassName,
  showThreadOptions,
  showMessageOptions,
  orientation = 'horizontal',
  messageRef,
}: Props) {
  const { t } = useCordTranslation('message');
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

  const { EmojiPicker, emojiPickerVisible } = useEmojiPicker(
    <WithTooltip label={t('add_reaction_action')}>
      <Button
        buttonType={'secondary'}
        size={'small'}
        icon={'AddEmoji'}
        buttonAction="select-emoji"
      />
    </WithTooltip>,
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

  const isMenuOpen = menuShowing || emojiPickerVisible;

  return (
    <div
      className={cx(classes.messageOptionsButtons, getClassName?.(isMenuOpen), {
        [MODIFIERS.open]: isMenuOpen,
      })}
    >
      {orientation === 'horizontal' && EmojiPicker}
      {showOptionsButton && (
        <OptionsMenu
          threadID={threadID}
          button={
            <WithTooltip label={t('message_options_tooltip')}>
              <Button
                icon="DotsThree"
                buttonType="secondary"
                size="small"
                buttonAction="thread-options"
              />
            </WithTooltip>
          }
          showThreadOptions={!!showThreadOptions}
          showMessageOptions={showMessageOptions}
          message={message}
          setMenuShowing={setMenuShowing}
          messageRef={messageRef}
        />
      )}
      {orientation === 'vertical' && EmojiPicker}
    </div>
  );
}
