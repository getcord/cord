import { createUseStyles } from 'react-jss';
import {
  baseBulletStylesMessageElement,
  listItemStyles,
} from 'common/ui/editorStyles.ts';
import { Sizes } from 'common/const/Sizes.ts';

const useStyles = createUseStyles({
  container: {
    paddingInlineStart: Sizes.BULLET_PADDING_LEFT,
    ...baseBulletStylesMessageElement,
  },
  listItem: listItemStyles,
});

type Props = {
  children: any;
  numberBullet?: boolean;
  bulletNumber?: number;
  indent: number;
};

export const MessageBulletElement = ({
  children,
  numberBullet,
  bulletNumber,
  indent,
}: Props) => {
  const classes = useStyles({
    numberBullet,
  });

  const listItem =
    indent <= 0 ? (
      <li value={bulletNumber} className={classes.listItem}>
        {children}
      </li>
    ) : (
      <MessageBulletElement
        numberBullet={numberBullet}
        bulletNumber={bulletNumber}
        indent={indent - 1}
      >
        {children}
      </MessageBulletElement>
    );

  return (
    <div className={classes.container}>
      {numberBullet ? <ol>{listItem}</ol> : <ul>{listItem}</ul>}
    </div>
  );
};
