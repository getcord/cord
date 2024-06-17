import { createUseStyles } from 'react-jss';
import { useSelected, useFocused } from 'slate-react';

import type { MessageContent, UUID } from 'common/types/index.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

const useStyles = createUseStyles({
  userReferenceElement: {
    cursor: 'pointer',
    textDecoration: 'none',
  },
  highlighted: {
    textDecoration: 'underline',
  },
});

type Props = React.PropsWithChildren<{
  attributes: any;
  userID: UUID;
  elementChildren: MessageContent;
}>;

export function MessageReassigneeElement({
  attributes,
  children,
  userID,
  elementChildren,
}: Props) {
  const selected = useSelected();
  const focused = useFocused();
  const classes = useStyles();

  const {
    byInternalID: { userByID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const user = userByID(userID);

  // The child of a user reference should be a text node with the text to use in
  // the composer, in case we haven't loaded the user yet.
  const placeholderText =
    elementChildren.length === 1 && elementChildren[0].type === undefined
      ? elementChildren[0].text.substring(1) // substring(1) removes the @ or +
      : userID;

  return (
    <span
      {...attributes}
      contentEditable={false}
      className={classes.userReferenceElement}
    >
      {'+'}
      <span className={selected && focused ? classes.highlighted : ''}>
        {user ? user.displayName : placeholderText}
      </span>
      {children}
    </span>
  );
}
