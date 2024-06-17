import * as React from 'react';
import cx from 'classnames';

import type { FormatStyle } from '@cord-sdk/types';
import { MessageNodeType } from '@cord-sdk/types';
import * as classes from '../../../components/composer/userReferences/UserReferenceElement.css.js';
import withCord from '../hoc/withCord.js';
import type { MandatoryReplaceableProps } from '../replacements.js';
import type { StyleProps } from '../../../betaV2.js';
import { useComponentUserData } from '../../hooks/useComponentUserData.js';

export type MessageUserReferenceElementProps = {
  userID: string;
  nodeType: MessageNodeType.ASSIGNEE | MessageNodeType.MENTION;
  formatStyle: FormatStyle;
} & StyleProps &
  MandatoryReplaceableProps;

export const MessageUserReferenceElement = withCord<
  React.PropsWithChildren<MessageUserReferenceElementProps>
>(
  React.forwardRef(function MessageUserReferenceElement(
    {
      userID,
      nodeType,
      formatStyle,
      className,
      ...restProps
    }: MessageUserReferenceElementProps,
    ref: React.ForwardedRef<HTMLSpanElement>,
  ) {
    const user = useComponentUserData(userID);
    const prefix = nodeType === MessageNodeType.MENTION ? '@' : '+';
    // We can have referenced users that the caller can't see all the data for, so
    // we access the user info if we have it but fall back to the
    // referencedUserData value if not. If the user is deleted, we may not have
    // anything at all, so finally fall back to a fixed string in that case.
    const name = user?.displayName ?? 'Unknown User';

    return formatStyle === 'normal' ? (
      <span
        className={cx(classes.userReferenceElement, className)}
        ref={ref}
        {...restProps}
      >
        {prefix}
        <span className={classes.userDisplayName}>{name}</span>
      </span>
    ) : (
      <span ref={ref} className={className} {...restProps}>
        {name}
      </span>
    );
  }),
  'MessageUserReferenceElement',
);
