import { useMemo } from 'react';
import cx from 'classnames';

import * as classes from 'external/src/components/ui3/composer/UserReferenceElement.css.ts';
import type { UUID } from 'common/types/index.ts';
import { MessageNodeType } from 'common/types/index.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import type { FormatStyle } from 'external/src/components/chat/message/StructuredMessage2.tsx';

type Props = {
  userID: UUID;
  referencedUserData: { id: UUID; name: string | null }[];
  nodeType: MessageNodeType.ASSIGNEE | MessageNodeType.MENTION;
  formatStyle: FormatStyle;
  className?: string;
};

export const MessageUserReferenceElement = ({
  userID,
  referencedUserData,
  nodeType,
  formatStyle,
  className,
}: Props) => {
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
    <span className={cx(classes.userReferenceElement, className)}>
      {prefix}
      <span className={classes.userDisplayName}>{name}</span>
    </span>
  ) : (
    <span>{name}</span>
  );
};
