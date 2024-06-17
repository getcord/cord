import { memo, forwardRef, useCallback } from 'react';
import type { ReactionsReactComponentProps } from '@cord-sdk/react';
import classes from 'external/src/components/ui3/Reactions.css.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { getUnseenReactions } from 'external/src/lib/util.ts';
import { ReactionsImpl } from 'external/src/components/2/ReactionsImpl.tsx';
import { Button } from 'external/src/components/ui3/Button.tsx';
import { useMessageByExternalID } from 'sdk/client/core/react/useMessageByExternalId.tsx';

export const ReactionsAddReactionButton = forwardRef(
  (
    props: {
      disabled: boolean;
    },
    ref: React.Ref<HTMLButtonElement>,
  ) => {
    return (
      <Button
        className={classes.addReaction}
        icon="AddEmoji"
        buttonType="secondary"
        buttonAction="select-emoji"
        size="small"
        ref={ref}
        {...props}
      />
    );
  },
);

function Reactions({
  threadId,
  messageId,
  showAddReactionButton = true,
  showReactionList = true,
}: ReactionsReactComponentProps) {
  const { user } = useContextThrowingIfNoProvider(IdentityContext);
  const { thread, message } = useMessageByExternalID({
    threadID: threadId,
    messageID: messageId,
  });
  const threadSDK = window.CordSDK?.thread;

  const onAddReaction = useCallback(
    (unicodeReaction: string) => {
      if (threadSDK && threadId && messageId) {
        void threadSDK.updateMessage(threadId, messageId, {
          addReactions: [unicodeReaction],
        });
      }
    },
    [messageId, threadId, threadSDK],
  );

  const onDeleteReaction = useCallback(
    (unicodeReaction: string) => {
      if (threadSDK && threadId && messageId) {
        void threadSDK.updateMessage(threadId, messageId, {
          removeReactions: [unicodeReaction],
        });
      }
    },
    [messageId, threadId, threadSDK],
  );

  if (!thread || !message) {
    return (
      <>
        {showAddReactionButton && (
          <ReactionsAddReactionButton disabled={true} />
        )}
      </>
    );
  }

  const unseenReactionsUnicode = getUnseenReactions(
    thread,
    message,
    user.externalID,
  ).map((reaction) => reaction.unicodeReaction);

  return (
    <ReactionsImpl
      reactions={message.reactions}
      unseenReactionsUnicode={unseenReactionsUnicode}
      onAddReaction={onAddReaction}
      onDeleteReaction={onDeleteReaction}
      showAddReactionButton={showAddReactionButton}
      showReactionList={showReactionList}
    />
  );
}

export default memo(Reactions);
