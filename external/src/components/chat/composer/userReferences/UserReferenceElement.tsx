import { useEffect } from 'react';
import { createUseStyles } from 'react-jss';
import { useSelected, useFocused, useSlateStatic } from 'slate-react';

import type { MessageContent, UUID } from 'common/types/index.ts';
import { MessageNodeType } from 'common/types/index.ts';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { getAssigneeNode } from 'external/src/components/chat/composer/userReferences/util.ts';
import { useComposerTask } from 'external/src/components/chat/composer/hooks/useComposerTask.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';
import { newUserReferenceElement } from 'external/src/components/ui3/composer/UserReferenceElement.tsx';

const useStyles = createUseStyles({
  userReferenceElement2: {
    color: cssVar('color-content-emphasis'),
    cursor: 'pointer',
    fontWeight: cssVar('font-weight-bold'),
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
  nodeType: MessageNodeType.ASSIGNEE | MessageNodeType.MENTION;
}>;

export const UserReferenceElement = withNewCSSComponentMaybe(
  newUserReferenceElement,
  function UserReferenceElement({
    attributes,
    children,
    userID,
    elementChildren,
    nodeType,
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

    const { addAssignee, removeAssignee } = useComposerTask();
    const editor = useSlateStatic();

    const editorRef = useUpdatingRef(editor);

    useEffect(() => {
      if (nodeType !== MessageNodeType.ASSIGNEE) {
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      const editor = editorRef.current;
      addAssignee(userID);
      return () => {
        const duplicateAssigneeElements = Boolean(
          getAssigneeNode(editor, userID),
        );
        if (!duplicateAssigneeElements) {
          removeAssignee(userID);
        }
      };
    }, [addAssignee, editorRef, nodeType, removeAssignee, user, userID]);

    return (
      <span
        {...attributes}
        contentEditable={false}
        className={classes.userReferenceElement2}
      >
        {nodeType === MessageNodeType.MENTION ? '@' : '+'}
        <span className={selected && focused ? classes.highlighted : ''}>
          {user ? user.displayName : placeholderText}
        </span>
        {children}
      </span>
    );
  },
);
