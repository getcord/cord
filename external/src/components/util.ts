import { APP_ORIGIN } from 'common/const/Urls.ts';
import type { NonNullableKeys, UUID } from 'common/types/index.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import type {
  MessageReactionFragment,
  UserFragment,
} from 'external/src/graphql/operations.ts';

export function createDefaultCustomNUX(applicationName: string) {
  return {
    initialOpen: {
      title: `Collaborate in ${applicationName}`,
      text: `Now you can work in ${applicationName} together!\nClick this button to leave comments, annotations, and tasks for you and your team.`,
      imageURL: `${APP_ORIGIN}/static/nux_animation_2.gif`,
    },
    welcome: {
      title: `Work together, right here`,
      text: `Try leaving a comment, @'ing a teammate, or annotating part of a page.`,
      imageURL: `${APP_ORIGIN}/static/nux_annotations_2.gif`,
    },
  };
}

export function isViewerPreviouslyAddedReaction(
  userID: UUID,
  reactions: MessageReactionFragment[],
  unicodeReaction: string,
) {
  const userReactionSet = !reactions
    ? new Set()
    : new Set(
        reactions
          .filter((reaction) => reaction.user.id === userID)
          .map((reaction) => reaction.unicodeReaction),
      );

  return userReactionSet.has(unicodeReaction);
}

type ReactionWithUser = NonNullableKeys<MessageReactionFragment, 'user'>;

export function useUsersByReactions(
  reactions: MessageReactionFragment[] | undefined,
): {
  [reaction: string]: UserFragment[];
} {
  const {
    byInternalID: { userByID },
  } = useContextThrowingIfNoProvider(UsersContext);
  const { user } = useContextThrowingIfNoProvider(IdentityContext);
  const viewerID = user.id;

  const reactionsWithUser = reactions?.filter(
    (reaction): reaction is ReactionWithUser => Boolean(reaction.user),
  );

  const usersByReaction: { [reaction: string]: UserFragment[] } = {};

  if (reactionsWithUser) {
    for (const reaction of reactionsWithUser) {
      if (!usersByReaction[reaction.unicodeReaction]) {
        usersByReaction[reaction.unicodeReaction] = [];
      }

      const reactionUser = userByID(reaction.user.id);
      if (reactionUser) {
        if (reactionUser.id === viewerID) {
          // show the current viewer user closet to the reaction
          usersByReaction[reaction.unicodeReaction].unshift(reactionUser);
        } else {
          usersByReaction[reaction.unicodeReaction].push(reactionUser);
        }
      }
    }
  }

  return usersByReaction;
}
