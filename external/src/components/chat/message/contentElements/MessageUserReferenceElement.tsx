import { useMemo } from 'react';
import { createUseStyles } from 'react-jss';

import type { UUID } from 'common/types/index.ts';
import { MessageNodeType } from 'common/types/index.ts';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import type { FormatStyle } from 'external/src/components/chat/message/StructuredMessage2.tsx';

type Props = {
  userID: UUID;
  referencedUserData: { id: UUID; name: string | null }[];
  nodeType: MessageNodeType.ASSIGNEE | MessageNodeType.MENTION;
  formatStyle: FormatStyle;
};

const useStyles = createUseStyles({
  notificationContentUserReferenceElement: {
    color: cssVar('notification-content-emphasis-text-color'),
  },
});

export const MessageUserReferenceElement = ({
  userID,
  referencedUserData,
  nodeType,
  formatStyle,
}: Props) => {
  const classes = useStyles();

  const {
    byInternalID: { userByID },
  } = useContextThrowingIfNoProvider(UsersContext);
  const memoizedUserData = useMemo(
    () => referencedUserData.find(({ id }) => id === userID),
    [userID, referencedUserData],
  );

  // We can have referenced users that the caller can't see all the data for, so
  // we access the user info if we have it but fall back to the
  // referencedUserData value if not. If the user is deleted, we may not have
  // anything at all, so finally fall back to a fixed string in that case.
  const user = userByID(userID);
  const prefix = nodeType === MessageNodeType.MENTION ? '@' : '+';
  const name = user?.displayName ?? memoizedUserData?.name ?? 'Unknown User';

  return formatStyle === 'normal' ? (
    <Text2
      className={classes.notificationContentUserReferenceElement}
      color="content-emphasis"
      as="span"
      font="body-emphasis"
    >
      {prefix}
      {name}
    </Text2>
  ) : (
    <span>{name}</span>
  );
};
