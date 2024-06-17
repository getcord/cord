import * as React from 'react';
import { forwardRef } from 'react';
import cx from 'classnames';

import withCord from '../hoc/withCord.js';
import classes from '../../../components/Avatar.css.js';
import type { AvatarFallbackProps } from '../../../betaV2.js';

export const AvatarFallback = withCord<
  React.PropsWithChildren<AvatarFallbackProps>
>(
  forwardRef(function AvatarFallback(
    { userData: user, className, ...restProps }: AvatarFallbackProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { displayName } = user;
    return (
      <div
        ref={ref}
        className={cx(classes.avatarFallback, className)}
        {...restProps}
      >
        {displayName[0].toUpperCase()}
      </div>
    );
  }),
  'AvatarFallback',
);
