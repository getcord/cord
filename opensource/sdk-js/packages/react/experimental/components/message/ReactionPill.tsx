import cx from 'classnames';
import * as React from 'react';
import EmojiConverter from 'emoji-js';

import type { ClientUserData } from '@cord-sdk/types';
import { DefaultTooltip, WithTooltip } from '../WithTooltip.js';
import * as fonts from '../../../common/ui/atomicClasses/fonts.css.js';
import { MODIFIERS } from '../../../common/ui/modifiers.js';
import * as classes from '../../../components/Reactions.classnames.js';
import { useCordTranslation } from '../../../hooks/useCordTranslation.js';

type ReactionPillProps = {
  unicodeReaction: string;
  users: ClientUserData[];
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

  return (
    <WithTooltip
      tooltip={
        <ReactionPillTooltip
          userData={users}
          isViewerReaction={isViewerReaction}
          unicodeReaction={unicodeReaction}
        />
      }
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

export type ReactionPillTooltipProps = {
  userData: ClientUserData[];
  isViewerReaction: boolean;
  unicodeReaction: string;
};

export const ReactionPillTooltip = ({
  userData,
  isViewerReaction,
  unicodeReaction,
}: ReactionPillTooltipProps) => {
  const { t } = useCordTranslation('message');
  const { t: userT } = useCordTranslation('user');

  const namesOfUsersWhoReactedArray = userData.map((user) =>
    userT('other_user', { user }),
  );

  const emoji = new EmojiConverter();
  emoji.colons_mode = true;

  if (isViewerReaction) {
    namesOfUsersWhoReactedArray.splice(0, 1, userT('viewer_user_short'));
  }

  return (
    <DefaultTooltip
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
    />
  );
};
