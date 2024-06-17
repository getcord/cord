import * as React from 'react';
import { forwardRef } from 'react';
import cx from 'classnames';
import type { ClientUserData } from '@cord-sdk/types';

import withCord from '../experimental/components/hoc/withCord.js';
import type { MandatoryReplaceableProps } from '../experimental/components/replacements.js';
import type { StyleProps } from '../experimental/types.js';
import { Facepile } from '../betaV2.js';

import * as classes from './EmptyPlaceholder.css.js';

export type EmptyPlaceholderProps = {
  users: ClientUserData[];
  type: string;
  hidden?: boolean;
  title: string;
  body?: string;
} & StyleProps &
  MandatoryReplaceableProps;

export const EmptyPlaceholder = withCord<
  React.PropsWithChildren<EmptyPlaceholderProps>
>(
  forwardRef(function EmptyPlaceholder(
    {
      users,
      hidden,
      className,
      title,
      body,
      type,
      ...restProps
    }: EmptyPlaceholderProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    if (hidden) {
      return null;
    }

    return (
      <div
        data-cord-placeholder={type}
        className={cx(classes.emptyPlaceholderContainer, className)}
        {...restProps}
        ref={ref}
      >
        {users.length > 0 && <Facepile users={users?.slice(0, 4)} />}
        <p className={classes.emptyPlaceholderTitle}>{title}</p>
        {body && <p className={classes.emptyPlaceholderBody}>{body}</p>}
      </div>
    );
  }),
  'EmptyPlaceholder',
);
