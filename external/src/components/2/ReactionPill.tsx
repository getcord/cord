import cx from 'classnames';

import EmojiConverter from 'emoji-js';
import * as fonts from 'common/ui/atomicClasses/fonts.css.ts';
import classes from 'external/src/components/ui3/Reactions.css.ts';
import { WithTooltip } from 'external/src/components/ui3/WithTooltip.tsx';
import { MODIFIERS } from 'common/ui/modifiers.ts';
import type { UserFragment } from 'external/src/graphql/operations.ts';
import { useCordTranslation } from '@cord-sdk/react';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

type ReactionPillProps = {
  unicodeReaction: string;
  users: UserFragment[];
  unseen: boolean;
  isViewerReaction: boolean;
  onDeleteReaction: (unicodeReaction: string) => void;
  onAddReaction: (unicodeReaction: string) => void;
};

export function ReactionPill({
  unicodeReaction,
  users,
  unseen,
  isViewerReaction,
  onAddReaction,
  onDeleteReaction,
}: ReactionPillProps) {
  const numOfReactions = users.length;
  const { t } = useCordTranslation('message');
  const { t: userT } = useCordTranslation('user');
  const emoji = new EmojiConverter();
  emoji.colons_mode = true;
  const namesOfUsersWhoReactedArray = users.map((user) =>
    userT('other_user', { user: userToUserData(user) }),
  );

  if (isViewerReaction) {
    namesOfUsersWhoReactedArray.splice(0, 1, userT('viewer_user_short'));
  }

  return (
    <WithTooltip
      label={t(
        isViewerReaction
          ? 'reaction_with_emoji_name_including_viewer_tooltip'
          : 'reaction_with_emoji_name_tooltip',
        {
          users: namesOfUsersWhoReactedArray,
          emojiName: emoji.replace_unified(unicodeReaction),
          count: namesOfUsersWhoReactedArray.length,
        },
      )}
    >
      <div
        className={cx(classes.pill, {
          [MODIFIERS.fromViewer]: isViewerReaction,
          [MODIFIERS.unseen]: unseen,
        })}
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
        <span className={classes.emoji}>{unicodeReaction}</span>
        <p
          className={cx(classes.count, fonts.fontSmallLight, {
            [MODIFIERS.unseen]: unseen,
          })}
        >
          {numOfReactions}
        </p>
      </div>
    </WithTooltip>
  );
}
