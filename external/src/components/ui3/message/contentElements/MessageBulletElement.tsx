import cx from 'classnames';
import * as classes from 'external/src/components/ui3/composer/BulletElement.css.ts';

type Props = {
  children: any;
  indent: number;
  numberBullet?: boolean;
  bulletNumber?: number;
  className?: string;
};

export const MessageBulletElement = ({
  children,
  numberBullet,
  bulletNumber,
  className,
  indent,
}: Props) => {
  const listItem =
    indent <= 0 ? (
      <li value={bulletNumber} className={classes.listItem}>
        {children}
      </li>
    ) : (
      <MessageBulletElement
        className={className}
        numberBullet={numberBullet}
        bulletNumber={bulletNumber}
        indent={indent - 1}
      >
        {children}
      </MessageBulletElement>
    );

  return (
    <>
      {numberBullet ? (
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
