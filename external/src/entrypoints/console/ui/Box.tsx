import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';

type BoxProps = React.PropsWithChildren<{
  className?: string;
  type?: 'alert';
}>;

const useStyles = createUseStyles({
  box: {
    borderRadius: Sizes.LARGE_BORDER_RADIUS,
    border: `1px solid ${Colors.GREY_LIGHT}`,
    display: 'flex',
    padding: Sizes.XLARGE,
    alignItems: 'flex-start',
    gap: Sizes.XLARGE,
    alignSelf: 'stretch',
    flexDirection: 'column',
  },
  alertBorder: {
    border: `1px solid ${Colors.ALERT}`,
  },
});

export default function Box({ children, className, type }: BoxProps) {
  const classes = useStyles();

  return (
    <section
      className={cx(classes.box, className, {
        [classes.alertBorder]: type === 'alert',
      })}
    >
      {children}
    </section>
  );
}
