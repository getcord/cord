import cx from 'classnames';
import { createUseStyles } from 'react-jss';
import { useCordTranslation } from '@cord-sdk/react';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { Facepile2 } from 'external/src/components/ui2/Facepile2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { cordifyClassname } from 'common/ui/style.ts';
import type { UserFragment } from 'external/src/graphql/operations.ts';
import { usersToUserData } from 'common/util/convertToExternal/user.ts';

const useStyles = createUseStyles({
  emptyStateContainer: {
    overflow: 'auto',
    margin: 'auto 0',
  },
});

type Props = {
  users: UserFragment[];
  title?: string;
  subtext?: string;
  className?: string;
};

/**
 * @deprecated Please use `ui3/thread/EmptyStateWithFacepile` instead.
 */
export function EmptyStateWithFacepile({ users, className }: Props) {
  const { t } = useCordTranslation('thread');
  const classes = useStyles();
  return (
    <Box2
      padding="m"
      className={cx(
        classes.emptyStateContainer,
        className,
        cordifyClassname('empty-state-placeholder'),
      )}
    >
      {users.length > 0 && (
        <Facepile2
          users={usersToUserData(users)}
          maxUsers={4}
          marginBottom="m"
          size="xl"
          showPresence={false}
        />
      )}
      <Text2 font="body-emphasis" color="content-emphasis" marginBottom="2xs">
        {t('placeholder_title')}
      </Text2>
      <Text2 font="body" color="content-primary">
        {t('placeholder_body')}
      </Text2>
    </Box2>
  );
}
