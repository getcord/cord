import * as React from 'react';
import cx from 'classnames';

import { Facepile } from '../Facepile.js';
import * as classes from './EmptyStateWithFacepile.css.js';

type Props = {
  users: string[];
  titlePlaceholder: string;
  bodyPlaceholder: string;
  className?: string;
};

export function EmptyStateWithFacepile({
  users,
  titlePlaceholder,
  bodyPlaceholder,
  className,
}: Props) {
  return (
    <div className={cx(classes.emptyStatePlaceholderContainer, className)}>
      {users.length > 0 && <Facepile users={users.slice(0, 4)} />}
      <p className={classes.emptyStatePlaceholderTitle}>{titlePlaceholder}</p>
      <p className={classes.emptyStatePlaceholderBody}>{bodyPlaceholder}</p>
    </div>
  );
}
