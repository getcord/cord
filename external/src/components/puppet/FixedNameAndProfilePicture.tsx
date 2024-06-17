import { createUseStyles } from 'react-jss';
import { ContentBox2 } from 'external/src/components/ui2/ContentBox2.tsx';
import { Avatar2 } from 'external/src/components/ui2/Avatar2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import type { UserFragment } from 'external/src/graphql/operations.ts';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

const useStyles = createUseStyles({
  centerContents: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: cssVar('space-m'),
  },
  nameField: {
    textAlign: 'center',
  },
});

type Props = {
  user: UserFragment;
};

export function FixedNameAndProfilePicture({ user }: Props) {
  const classes = useStyles();
  return (
    <ContentBox2 padding="m" className={classes.centerContents}>
      <Avatar2 user={userToUserData(user)} size="4xl" />
      <Text2 className={classes.nameField} color="content-emphasis">
        {user.displayName}
      </Text2>
    </ContentBox2>
  );
}
