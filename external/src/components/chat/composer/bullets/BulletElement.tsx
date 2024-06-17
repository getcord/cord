import cx from 'classnames';
import { createUseStyles } from 'react-jss';
import { listItemStyles } from 'common/ui/editorStyles.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';
import { newBulletElement } from 'external/src/components/ui3/composer/BulletElement.tsx';

const useStyles = createUseStyles({
  container: { paddingLeft: Sizes.BULLET_PADDING_LEFT },
  listItem: listItemStyles,
});

type Props = {
  attributes: any;
  children: any;
  indent: number;
  numberBullet?: boolean;
  bulletNumber?: number;
};

export const BulletElement = withNewCSSComponentMaybe(
  newBulletElement,
  ({ attributes, children, numberBullet, bulletNumber, indent }: Props) => {
    const classes = useStyles({ numberBullet });

    const listItem =
      indent <= 0 ? (
        <li value={bulletNumber} className={classes.listItem}>
          {children}
        </li>
      ) : (
        <BulletElement
          attributes={attributes}
          numberBullet={numberBullet ?? false}
          bulletNumber={bulletNumber}
          indent={indent - 1}
        >
          {children}
        </BulletElement>
      );

    return (
      <div className={cx([classes.container])} {...attributes}>
        {numberBullet ? (
          // adding the margin:0 allows us to copy and paste lists from Cord to
          // Slack without any spaces
          <ol
            style={{
              margin: 0,
              // fix for "all: revert" CSS causing the list numbers to all be "1" in Firefox
              // despite having the right "value" prop on the <li>
              counterReset: `list-item ${(bulletNumber ?? 1) - 1}`,
            }}
          >
            {listItem}
          </ol>
        ) : (
          <ul style={{ margin: 0 }}>{listItem}</ul>
        )}
      </div>
    );
  },
);
