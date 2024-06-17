import cx from 'classnames';
import type { IconType } from 'external/src/components/ui2/icons/Icon2.tsx';
import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';

import * as classes from 'external/src/components/ui3/EmptyStateWithIcon.css.ts';

type Props = {
  title: string;
  subtext: string;
  iconName: IconType;
  className?: string;
};

export function EmptyStateWithIcon({
  title,
  subtext,
  iconName,
  className,
}: Props) {
  return (
    <div className={cx(classes.emptyStateContainer, className)}>
      <Icon name={iconName} color="brand-primary" />
      <p className={classes.emptyStateTitle}>{title}</p>
      <p className={classes.emptyStateBody}>{subtext}</p>
    </div>
  );
}
