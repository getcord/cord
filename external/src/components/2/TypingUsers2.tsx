import { createUseStyles } from 'react-jss';
import { useCordTranslation } from '@cord-sdk/react';
import { Facepile2 } from 'external/src/components/ui2/Facepile2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import type { UserFragment } from 'external/src/graphql/operations.ts';
import { MessageBlockRow2 } from 'external/src/components/2/MessageBlockRow2.tsx';
import { usersToUserData } from 'common/util/convertToExternal/user.ts';

const useStyles = createUseStyles({
  '@keyframes animateDots': {
    '50%': {
      content: '".."',
    },
    '100%': {
      content: '"..."',
    },
  },

  typingIndicator: {
    '&::after': {
      content: '"."',
      animation: '$animateDots 1s linear infinite',
    },
  },
});

/**
 * @deprecated Please use `ui3/TypingUsers` instead.
 */
export function TypingUsers2({ users }: { users: UserFragment[] }) {
  const { t } = useCordTranslation('thread');
  const classes = useStyles();

  if (!users.length) {
    return null;
  }

  return (
    <MessageBlockRow2
      useMinWidthForLeft={true}
      leftElement={
        <Facepile2 users={usersToUserData(users)} showPresence={false} />
      }
      padding="2xs"
    >
      <Text2
        color="content-secondary"
        font="small"
        className={classes.typingIndicator}
      >
        {t('typing_users_status')}
      </Text2>
    </MessageBlockRow2>
  );
}
