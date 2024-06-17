import { useCallback } from 'react';

import { useCordTranslation } from '@cord-sdk/react';
import type { MessageReactionFragment } from 'external/src/graphql/operations.ts';
import {
  useUsersByReactions,
  isViewerPreviouslyAddedReaction,
} from 'external/src/components/util.ts';
import { ReactionPill } from 'external/src/components/2/ReactionPill.tsx';
import classes from 'external/src/components/ui3/Reactions.css.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { useEmojiPicker } from 'external/src/components/ui3/EmojiPicker.tsx';
import { ReactionsAddReactionButton } from 'sdk/client/core/react/Reactions.tsx';
import { WithTooltip } from 'external/src/components/ui3/WithTooltip.tsx';

type Props = {
  reactions: MessageReactionFragment[];
  unseenReactionsUnicode: string[];
  onDeleteReaction: (unicodeReaction: string) => void;
  onAddReaction: (unicodeReaction: string) => void;
  showAddReactionButton: boolean;
  showReactionList: boolean;
};

export function ReactionsImpl({
  reactions,
  unseenReactionsUnicode,
  onDeleteReaction,
  onAddReaction,
  showAddReactionButton,
  showReactionList,
}: Props) {
  const { t } = useCordTranslation('message');
  const { user } = useContextThrowingIfNoProvider(IdentityContext);

  const showAddReactionTooltip = showAddReactionButton && !showReactionList;

  const handleAddReactionClick = useCallback(
    (unicodeReaction: string) => {
      if (reactions) {
        isViewerPreviouslyAddedReaction(user.id, reactions, unicodeReaction)
          ? onDeleteReaction(unicodeReaction)
          : onAddReaction(unicodeReaction);
      }
    },
    [reactions, onAddReaction, onDeleteReaction, user.id],
  );

  const addReactionElement = showAddReactionTooltip ? (
    <WithTooltip label={t('add_reaction_action')}>
      <ReactionsAddReactionButton disabled={false} />
    </WithTooltip>
  ) : (
    <ReactionsAddReactionButton disabled={false} />
  );

  const { EmojiPicker } = useEmojiPicker(
    addReactionElement,
    handleAddReactionClick,
  );

  const usersByReaction = useUsersByReactions(reactions);

  return (
    <div className={classes.reactionsContainer}>
      {showReactionList ? (
        <div className={classes.reactionList}>
          {Object.entries(usersByReaction).map(([unicodeReaction, users]) => (
            <ReactionPill
              key={unicodeReaction}
              unicodeReaction={unicodeReaction}
              users={users}
              unseen={unseenReactionsUnicode.includes(unicodeReaction)}
              onAddReaction={onAddReaction}
              onDeleteReaction={onDeleteReaction}
              isViewerReaction={isViewerPreviouslyAddedReaction(
                user.id,
                reactions,
                unicodeReaction,
              )}
            />
          ))}
          {showAddReactionButton && EmojiPicker}
        </div>
      ) : (
        showAddReactionButton && EmojiPicker
      )}
    </div>
  );
}
