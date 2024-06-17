import { useMemo } from 'react';
import cx from 'classnames';

import { useCordTranslation } from '@cord-sdk/react';
import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';
import { Facepile } from 'external/src/components/ui3/Facepile.tsx';
import { useThreadData } from 'external/src/components/2/hooks/useThreadData.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import type { UserFragment } from 'external/src/graphql/operations.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import {
  fontSmall,
  fontSmallEmphasis,
} from 'common/ui/atomicClasses/fonts.css.ts';
import { MODIFIERS } from 'common/ui/modifiers.ts';
import * as classes from 'external/src/components/ui3/thread/CollapsedThreadFooter.css.ts';
import { usersToUserData } from 'common/util/convertToExternal/user.ts';

type Props = {
  newMessageCount: number;
  replyCount: number;
  hoveringOverThread: boolean;
  allowReply: boolean;
};

export function CollapsedThreadFooter({
  newMessageCount,
  replyCount,
  hoveringOverThread,
  allowReply,
}: Props) {
  const { t } = useCordTranslation('thread');
  const thread = useThreadData()!;

  const {
    byInternalID: { userByID },
  } = useContextThrowingIfNoProvider(UsersContext);

  // This includes both action_message and user_message replies.
  const usersWhoRepliedToThread = useMemo(() => {
    const users: UserFragment[] = [];
    const userIDs = Array.from(
      new Set([
        ...thread.replyingUserIDs,
        ...thread.actionMessageReplyingUserIDs,
      ]),
    );

    for (const userID of userIDs) {
      if (!userID) {
        continue;
      }

      const user = userByID(userID);
      if (user) {
        users.push(user);
      }
    }
    return usersToUserData(users);
  }, [userByID, thread.replyingUserIDs, thread.actionMessageReplyingUserIDs]);

  // Special case - nothing to show because there are no replies, no new messages,
  // and 'Reply' is not allowed (e.g. because from ThreadList there is no default
  // way to move to a state with a composer from a collapsed thread)
  if (!allowReply && !newMessageCount && !replyCount) {
    return null;
  }

  return (
    <div
      className={cx(classes.threadFooterContainer, {
        [MODIFIERS.badged]: thread.subscribed && newMessageCount > 0,
        [MODIFIERS.unseen]: newMessageCount,
        [MODIFIERS.subscribed]: thread.subscribed,
      })}
    >
      {replyCount === 0 ? (
        <>
          {!newMessageCount && <Icon name="ArrowBendDownRight" />}
          <p
            className={cx({
              [fontSmallEmphasis]: newMessageCount,
              [fontSmall]: !newMessageCount,
            })}
          >
            {newMessageCount ? t('new_status') : t('reply_action')}
          </p>
        </>
      ) : (
        <>
          <Facepile
            users={usersWhoRepliedToThread}
            showPresence={false}
            showExtraUsersNumber={false}
            size="m"
          />
          <p
            className={cx({
              [fontSmallEmphasis]: newMessageCount,
              [fontSmall]: !newMessageCount,
            })}
          >
            {hoveringOverThread && allowReply
              ? t('reply_action')
              : newMessageCount
              ? t('new_replies_status', { count: newMessageCount })
              : t('replies_status', { count: replyCount })}
          </p>
        </>
      )}
    </div>
  );
}
