import { useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { useCordTranslation } from '@cord-sdk/react';
import { cssVar } from 'common/ui/cssVariables.ts';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { Facepile2 } from 'external/src/components/ui2/Facepile2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { useThreadData } from 'external/src/components/2/hooks/useThreadData.ts';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { MessageBlockRow2 } from 'external/src/components/2/MessageBlockRow2.tsx';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import type { UserFragment } from 'external/src/graphql/operations.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { cordifyClassname } from 'common/ui/style.ts';
import { usersToUserData } from 'common/util/convertToExternal/user.ts';

const useStyles = createUseStyles({
  badge: {
    borderRadius: '100%',
  },
  threadFooterContainer: {
    display: 'flex',
    alignItem: 'center',
    gap: cssVar('space-2xs'),
    cursor: 'pointer',
  },
  newSubscribed: {
    color: cssVar('message-status-text-new-subscribed'),
  },
  newNotSubscribed: {
    color: cssVar('message-status-text-new-not-subscribed'),
  },
  notNew: {
    color: cssVar('color-content-emphasis'),
  },
});

type Props = {
  newMessageCount: number;
  replyCount: number;
  hoveringOverThread: boolean;
  allowReply: boolean;
};

export function CollapsedThreadFooter2({
  newMessageCount,
  replyCount,
  hoveringOverThread,
  allowReply,
}: Props) {
  const { t } = useCordTranslation('thread');
  const classes = useStyles();
  const thread = useThreadData()!;

  const {
    byInternalID: { userByID },
  } = useContextThrowingIfNoProvider(UsersContext);

  // This includes both action_message and user_message replies
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

  const textColourClass = newMessageCount
    ? thread.subscribed
      ? classes.newSubscribed
      : classes.newNotSubscribed
    : classes.notNew;

  // Special case - nothing to show because there are no replies, no new messages,
  // and 'Reply' is not allowed (e.g. because from ThreadList there is no default
  // way to move to a state with a composer from a collapsed thread)
  if (!allowReply && !newMessageCount && !replyCount) {
    return null;
  }

  const children = () => {
    if (replyCount === 0) {
      return (
        <Row2>
          {!newMessageCount && <Icon2 name="ArrowBendDownRight" />}
          <Text2
            className={textColourClass}
            font={newMessageCount ? 'small-emphasis' : 'small'}
            marginLeft={newMessageCount ? 'none' : '2xs'}
          >
            {newMessageCount ? t('new_status') : t('reply_action')}
          </Text2>
        </Row2>
      );
    }

    // Has replies
    return (
      <>
        <Facepile2
          users={usersWhoRepliedToThread}
          showPresence={false}
          showExtraUsersNumber={false}
          size="m"
        />
        <Text2
          font={newMessageCount ? 'small-emphasis' : 'small'}
          className={textColourClass}
        >
          {hoveringOverThread && allowReply
            ? t('reply_action')
            : newMessageCount
            ? t('new_replies_status', { count: newMessageCount })
            : t('replies_status', { count: replyCount })}
        </Text2>
      </>
    );
  };

  return (
    <MessageBlockRow2
      className={cx(
        classes.threadFooterContainer,
        cordifyClassname('collapsed-thread-footer'),
      )}
      padding="2xs"
      leftElement={
        thread.subscribed && newMessageCount > 0 ? (
          <Box2
            backgroundColor="notification"
            width="2xs"
            height="2xs"
            className={classes.badge}
            marginLeft="auto"
          />
        ) : null
      }
    >
      {children()}
    </MessageBlockRow2>
  );
}
