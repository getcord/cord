import * as React from 'react';
import { useSelected, useFocused } from 'slate-react';
import cx from 'classnames';

import type { MessageContent } from '@cord-sdk/types';
import * as classes from '../../../components/composer/userReferences/UserReferenceElement.css.js';
import { MODIFIERS } from '../../../common/ui/modifiers.js';
import { useComponentUserData } from '../../hooks/useComponentUserData.js';

type Props = React.PropsWithChildren<{
  attributes: any;
  userID: string;
  elementChildren: MessageContent;
}>;

export function UserReferenceElement({
  attributes,
  children,
  userID,
  elementChildren,
}: Props) {
  const selected = useSelected();
  const focused = useFocused();
  const displayName = useComponentUserData(userID)?.displayName;

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
      className={cx(classes.userReferenceElement, {
        [MODIFIERS.highlighted]: selected && focused,
      })}
    >
      {'@'}
      <span className={classes.userDisplayName}>
        {displayName ? displayName : placeholderText}
      </span>
      {children}
    </span>
  );
}
