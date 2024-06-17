import { useCallback } from 'react';

import { useCordTranslation } from '@cord-sdk/react';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import type {
  MessageFragment,
  ThreadFragment,
} from 'external/src/graphql/operations.ts';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { MessageBlockRow2 } from 'external/src/components/2/MessageBlockRow2.tsx';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { newThreadMessageSeenBy } from 'external/src/components/ui3/ThreadMessageSeenBy.tsx';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

const DEFAULT_NUM_OF_NAMES_TO_SHOW = 3; // After which we'll show "and X others";

export const ThreadMessageSeenBy = withNewCSSComponentMaybe(
  newThreadMessageSeenBy,
  function ThreadMessageSeenBy({
    participants,
    message,
  }: {
    participants: ThreadFragment['participants'] | null;
    message: MessageFragment;
  }) {
    const { t } = useCordTranslation('message');
    const { t: userT } = useCordTranslation('user');
    const { user: viewer } = useContextThrowingIfNoProvider(IdentityContext);
    const {
      byInternalID: { usersByID },
    } = useContextThrowingIfNoProvider(UsersContext);

    const getSeenByDisplayLabel = useCallback(
      (
        allUsersWhoSawMessage: ThreadFragment['participants'],
        viewerId: string | undefined,
        numOfNamesToShow: number = DEFAULT_NUM_OF_NAMES_TO_SHOW,
      ) => {
        if (allUsersWhoSawMessage.length <= 0) {
          return null;
        }

        const namesOfActiveUsersWhoSaw: string[] = [];
        allUsersWhoSawMessage.forEach(({ user }) => {
          if (!user) {
            return;
          }

          if (viewerId !== user.id) {
            const userDetails = usersByID(user.id)[0];
            if (!userDetails) {
              return;
            }
            namesOfActiveUsersWhoSaw.push(
              userT('other_user', { user: userToUserData(userDetails) }),
            );
          }
        });

        if (namesOfActiveUsersWhoSaw.length === 0) {
          return null;
        }

        if (numOfNamesToShow < namesOfActiveUsersWhoSaw.length) {
          const numOfOtherUsers =
            namesOfActiveUsersWhoSaw.length - numOfNamesToShow;
          return t('seen_by_status_overflow', {
            users: namesOfActiveUsersWhoSaw.slice(0, numOfNamesToShow),
            count: numOfOtherUsers,
          });
        } else {
          return t('seen_by_status', { users: namesOfActiveUsersWhoSaw });
        }
      },
      [usersByID, t, userT],
    );

    const allUsersWhoSawMessage = getAllUsersWhoSawMessage(
      message,
      participants,
    );

    if (message.type !== 'user_message') {
      return null;
    }

    const truncatedSeenBy = getSeenByDisplayLabel(
      allUsersWhoSawMessage,
      viewer?.id,
    );

    if (!truncatedSeenBy) {
      return null;
    }

    return (
      <WithTooltip2
        label={
          allUsersWhoSawMessage.length > DEFAULT_NUM_OF_NAMES_TO_SHOW
            ? getSeenByDisplayLabel(
                allUsersWhoSawMessage,
                viewer?.id,
                allUsersWhoSawMessage.length,
              )
            : null
        }
      >
        <MessageBlockRow2 paddingLeft="2xs" leftElement={null}>
          <Text2 color="content-secondary" font="small-light">
            {truncatedSeenBy}
          </Text2>
        </MessageBlockRow2>
      </WithTooltip2>
    );
  },
);

function getAllUsersWhoSawMessage(
  message: MessageFragment,
  participants: ThreadFragment['participants'] | null,
) {
  return (
    participants?.filter(
      (participant) =>
        participant.user?.id !== message.source.id &&
        participant.lastSeenTimestamp &&
        new Date(message.timestamp).getTime() <=
          new Date(participant.lastSeenTimestamp).getTime(),
    ) ?? []
  );
}
