import type { ForwardedRef } from 'react';
import { forwardRef } from 'react';
import cx from 'classnames';
import { Slot } from '@radix-ui/react-slot';

import * as classes from 'external/src/components/ui3/WithBadge.css.ts';

type Props = React.PropsWithChildren<{
  count?: number;
}>;

export const WithBadge = forwardRef(function WithBadge(
  { children, count }: Props,
  ref: ForwardedRef<HTMLElement>,
) {
  return (
    <Slot
      ref={ref}
      className={cx(classes.badge)}
      data-cord-badge-count={count && count <= 9 ? count : '9+'}
    >
      {children}
    </Slot>
  );
});
