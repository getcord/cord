import { useCallback } from 'react';

import cx from 'classnames';
import { useCordTranslation } from '@cord-sdk/react';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import type {
  MessageFragment,
  ThreadFragment,
} from 'external/src/graphql/operations.ts';
import { WithTooltip } from 'external/src/components/ui3/WithTooltip.tsx';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import * as classes from 'external/src/components/ui3/ThreadMessageSeenBy.css.ts';
import { fontSmallLight } from 'common/ui/atomicClasses/fonts.css.ts';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

const DEFAULT_NUM_OF_NAMES_TO_SHOW = 3; // After which we'll show "and X others";

const MAX_TOOLTIP_NAMES_TO_SHOW = 30;

export function ThreadMessageSeenBy({
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

  const allUsersWhoSawMessage = getAllUsersWhoSawMessage(message, participants);

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
    <WithTooltip
      label={
        allUsersWhoSawMessage.length > DEFAULT_NUM_OF_NAMES_TO_SHOW
          ? getSeenByDisplayLabel(
              allUsersWhoSawMessage,
              viewer?.id,
              allUsersWhoSawMessage.length > MAX_TOOLTIP_NAMES_TO_SHOW
                ? MAX_TOOLTIP_NAMES_TO_SHOW
                : allUsersWhoSawMessage.length,
            )
          : null
      }
    >
      <div className={cx(classes.threadSeenBy, fontSmallLight)}>
        {truncatedSeenBy}
      </div>
    </WithTooltip>
  );
}

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

export const newThreadMessageSeenBy = {
  NewComp: ThreadMessageSeenBy,
  configKey: 'threadMessageSeenBy',
} as const;
