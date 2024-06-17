import cx from 'classnames';
import * as classes from 'external/src/components/ui3/composer/BulletElement.css.ts';

type Props = {
  children: React.ReactNode;
  indent: number;
  numberBullet?: boolean;
  bulletNumber?: number;
};

// This gets rid of props this new version of BulletElement does not need, but the are needed by the old one.
const BulletElementOldToNew = ({
  attributes: _,
  ...restProps
}: Props & { attributes: unknown }) => <BulletElement {...restProps} />;

export const BulletElement = ({
  children,
  numberBullet,
  bulletNumber,
  indent,
}: Props) => {
  const listItem =
    indent <= 0 ? (
      <li value={bulletNumber} className={classes.listItem}>
        {children}
      </li>
    ) : (
      <BulletElement
        numberBullet={numberBullet}
        bulletNumber={bulletNumber}
        indent={indent - 1}
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
            // fix for "all: revert" CSS causing the list numbers to all be "1" in Firefox
            // despite having the right "value" prop on the <li>
            counterReset: `list-item ${(bulletNumber ?? 1) - 1}`,
          }}
        >
          {listItem}
        </ol>
      ) : (
        <ul className={cx(classes.container, classes.unorderedList)}>
          {listItem}
        </ul>
      )}
    </>
  );
};

export const newBulletElement = {
  NewComp: BulletElementOldToNew,
  configKey: 'bulletElement',
} as const;
