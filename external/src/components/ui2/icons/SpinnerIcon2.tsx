import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';

const useStyles = createUseStyles({
  spinner: {
    animation: `$spin 1s linear infinite`,
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
});

type Props = {
  size?: 'small' | 'large';
  className?: string;
};
export function SpinnerIcon2({ size, className }: Props) {
  const classes = useStyles();

  return (
    <Icon2
      className={cx(className, classes.spinner)}
      name="CircleNotch"
      size={size ?? 'large'}
      aria-label="loading"
      aria-busy="true"
      aria-live="polite"
    />
  );
}
