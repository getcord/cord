import * as React from 'react';
import cx from 'classnames';
import * as classes from './BulletElement.css.js';

type Props = {
  attributes: any;
  children: React.ReactNode;
  indent: number;
  numberBullet?: boolean;
  bulletNumber?: number;
};

export const BulletElement = ({
  attributes,
  children,
  numberBullet,
  bulletNumber,
  indent,
}: Props) => {
  const listItem =
    indent <= 0 ? (
      <li value={bulletNumber} className={classes.listItem} {...attributes}>
        {children}
      </li>
    ) : (
      <BulletElement
        numberBullet={numberBullet}
        bulletNumber={bulletNumber}
        indent={indent - 1}
        attributes={attributes}
      >
        {children}
      </BulletElement>
    );

  return (
    <>
      {numberBullet ? (
        <ol
          className={cx(classes.container, classes.orderedList)}
          style={{
            // Fix for "all: revert" CSS causing the list numbers to all be "1" in Firefox
            // despite having the right "value" prop on the <li>
            counterReset: `list-item ${(bulletNumber ?? 1) - 1}`,
          }}
          {...attributes}
        >
          {listItem}
        </ol>
      ) : (
        <ul
          className={cx(classes.container, classes.unorderedList)}
          {...attributes}
        >
          {listItem}
        </ul>
      )}
    </>
  );
};
