import type { ButtonProps } from 'react-bootstrap';
import { Button } from 'react-bootstrap';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { Styles } from 'common/const/Styles.ts';

const useStyles = createUseStyles({
  button: {
    backgroundColor: Colors.GREY_X_DARK,
    borderColor: Colors.GREY_X_DARK,
    borderRadius: Sizes.DEFAULT_BORDER_RADIUS,
    // To mimic with react-bootstrap button styling
    borderWidth: '1px',
    boxShadow: Styles.DEFAULT_SHADOW,
    color: Colors.WHITE,
    // To mimic with react-bootstrap button styling
    padding: '6px 12px',
    '&:hover': {
      backgroundColor: Colors.BLACK,
      borderColor: Colors.BLACK,
      color: Colors.WHITE,
    },
  },
  buttonDisabled: {
    backgroundColor: Colors.GREY_DARK,
    borderColor: Colors.GREY_DARK,
    boxShadow: 0,
    borderStyle: 'solid',
    '&:hover': {
      backgroundColor: Colors.GREY_DARK,
      borderColor: Colors.GREY_DARK,
    },
  },
});

type Props = ButtonProps;

export function CustomButton({
  children,
  ...propsToPassDirectly
}: React.PropsWithChildren<Props>) {
  const classes = useStyles();

  return (
    <Button
      className={cx(classes.button, {
        [classes.buttonDisabled]: propsToPassDirectly.disabled,
      })}
      {...propsToPassDirectly}
      bsPrefix={classes.button}
    >
      {children}
    </Button>
  );
}
