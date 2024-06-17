import type { ClientUserData, Reaction } from '@cord-sdk/types';
import { useViewerData } from '../../hooks/user.js';
import { useComponentUserData } from '../../experimental/hooks/useComponentUserData.js';

export function useUsersByReactions(reactions: Reaction[] | undefined): {
  [reaction: string]: ClientUserData[];
} {
  const viewerData = useViewerData();
  const viewerID = viewerData?.id;

  const reactionUserIDs = new Set(
    reactions?.map((reaction) => reaction.userID),
  );

  const reactionUserIDsArray = [...reactionUserIDs];

  const reactionUsers = useComponentUserData(reactionUserIDsArray);

  const usersByReaction: { [reaction: string]: ClientUserData[] } = {};

  if (reactions) {
    for (const reaction of reactions) {
      if (!usersByReaction[reaction.reaction]) {
        usersByReaction[reaction.reaction] = [];
      }

      const reactionUser = reactionUsers[reaction.userID];

      if (reactionUser) {
        if (reaction.userID === viewerID) {
          // show the current viewer user closest to the reaction
          usersByReaction[reaction.reaction].unshift(reactionUser);
        } else {
          usersByReaction[reaction.reaction].push(reactionUser);
        }
      }
    }
  }

  return usersByReaction;
}
