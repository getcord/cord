import cx from 'classnames';

import * as classes from 'external/src/components/2/EmptyStateWithFacepile.css.js';
import { Facepile } from 'sdk/client/core/react/Facepile.tsx';

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
