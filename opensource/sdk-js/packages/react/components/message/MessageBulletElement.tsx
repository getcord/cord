import * as React from 'react';
import cx from 'classnames';
import * as classes from '../composer/BulletElement.css.js';

type Props = {
  children: JSX.Element[];
  bulletNumber?: number;
  className?: string;
};

export const MessageBulletElement = ({
  children,
  bulletNumber,
  className,
}: Props) => {
  const listItem = (
    <li value={bulletNumber} className={classes.listItem}>
      {children}
    </li>
  );

  return (
    <>
      {bulletNumber ? (
        <ol className={cx(classes.container, classes.orderedList, className)}>
          {listItem}
        </ol>
      ) : (
        <ul className={cx(classes.container, classes.unorderedList, className)}>
          {listItem}
        </ul>
      )}
    </>
  );
};
