import * as React from 'react';
import { useCallback, useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import type {
  MessageReactionFragment,
  UserFragment,
} from 'external/src/graphql/operations.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { useEmojiPicker2 } from 'external/src/components/ui2/EmojiPicker2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { addSpaceVars, cssVar } from 'common/ui/cssVariables.ts';
import { EMOJI_STYLE } from 'common/ui/editorStyles.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import {
  isViewerPreviouslyAddedReaction,
  useUsersByReactions,
} from 'external/src/components/util.ts';

const useStyles = createUseStyles({
  allPastReactionsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginTop: `${Sizes.MEDIUM}px`,
  },
  reactionContainer: {
    alignItems: 'center',
    cursor: 'pointer',
    display: 'flex',
  },
  reactionPicker: {
    border: 'unset',
    justifyContent: 'center',
    width: '24px',
  },
  reactionPill2: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    justifyContent: 'space-between',
    gap: cssVar('space-3xs'),
    minWidth: addSpaceVars('m', 'l'),
  },
  emojiReaction: {
    ...EMOJI_STYLE,
    lineHeight: cssVar('space-m'),
  },
  unseenPill: {
    border: `1px solid ${cssVar('color-notification')}`,
  },
  unseenCount: {
    color: cssVar('color-notification'),
    fontWeight: 700,
  },
});

type Props = {
  reactions: MessageReactionFragment[];
  unseenReactionsUnicode: string[];
  onDeleteReaction: (unicodeReaction: string) => void;
  onAddReaction: (unicodeReaction: string) => void;
};

export function PastReactions({
  reactions,
  unseenReactionsUnicode,
  onDeleteReaction,
  onAddReaction,
}: Props) {
  const classes = useStyles();
  const { user } = useContextThrowingIfNoProvider(IdentityContext);

  const usersByReaction = useUsersByReactions(reactions);

  const onClickAddReaction = useCallback(
    (unicodeReaction: string) =>
      isViewerPreviouslyAddedReaction(user.id, reactions, unicodeReaction)
        ? onDeleteReaction(unicodeReaction)
        : onAddReaction(unicodeReaction),
    [onAddReaction, onDeleteReaction, reactions, user.id],
  );

  const { EmojiPicker } = useEmojiPicker2(
    <Button2 icon="AddEmoji" buttonType={'secondary'} size={'small'} />,
    onClickAddReaction,
  );

  return (
    <div className={classes.allPastReactionsContainer}>
      {Object.entries(usersByReaction).map(([unicodeReaction, users]) => (
        <React.Fragment key={unicodeReaction}>
          <ReactionPill
            onAddReaction={onAddReaction}
            onDeleteReaction={onDeleteReaction}
            isViewerReaction={isViewerPreviouslyAddedReaction(
              user.id,
              reactions,
              unicodeReaction,
            )}
            unicodeReaction={unicodeReaction}
            users={users}
            unseen={unseenReactionsUnicode.includes(unicodeReaction)}
          />
        </React.Fragment>
      ))}
      {Object.keys(usersByReaction).length > 0 && EmojiPicker}
    </div>
  );
}

function ReactionPill({
  unicodeReaction,
  users,
  unseen,
  isViewerReaction,
  onAddReaction,
  onDeleteReaction,
}: {
  unicodeReaction: string;
  users: UserFragment[];
  unseen: boolean;
  isViewerReaction: boolean;
  onDeleteReaction: (unicodeReaction: string) => void;
  onAddReaction: (unicodeReaction: string) => void;
}) {
  const classes = useStyles();

  const numOfReactions = users.length;
  const namesOfUsersWhoReacted = useMemo(() => {
    const nameOfUsersWhoReacted = users.map((user) => user.displayName);

    if (isViewerReaction) {
      nameOfUsersWhoReacted.splice(0, 1, 'You');
    }

    return nameOfUsersWhoReacted.join(', ');
  }, [isViewerReaction, users]);

  return (
    <WithTooltip2
      label={namesOfUsersWhoReacted}
      className={classes.reactionContainer}
      onClick={(event) => {
        event.stopPropagation();
        const userClickedTooManyTimes = event.detail > 1;
        if (userClickedTooManyTimes) {
          // Avoid spamming the DB with requests
          return;
        }

        if (isViewerReaction) {
          onDeleteReaction(unicodeReaction);
        } else {
          onAddReaction(unicodeReaction);
        }
      }}
    >
      <Box2
        backgroundColor={isViewerReaction ? 'base-x-strong' : 'base-strong'}
        backgroundColorHover="base-x-strong"
        padding="3xs"
        className={cx(classes.reactionPill2, { [classes.unseenPill]: unseen })}
        borderRadius="medium"
      >
        <span className={classes.emojiReaction}>{unicodeReaction}</span>
        <Text2
          color="content-emphasis"
          font="small-light"
          className={cx({ [classes.unseenCount]: unseen })}
        >
          {numOfReactions}
        </Text2>
      </Box2>
    </WithTooltip2>
  );
}
