import { createUseStyles } from 'react-jss';
import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '@material-ui/core';
import { CONSOLE_ORIGIN } from 'common/const/Urls.ts';
import { ConsoleRoutes } from 'external/src/entrypoints/console/routes.ts';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';

const useStyles = createUseStyles({
  loginButton: {
    color: Colors.GREY_X_DARK,
    border: `${Sizes.DEFAULT_BORDER_WIDTH}px solid ${Colors.GREY_X_DARK}`,
    borderRadius: Sizes.DEFAULT_BORDER_RADIUS,
  },
});

const LoginButton = ({ type }: { type?: 'signup' }) => {
  const { loginWithRedirect } = useAuth0();
  const classes = useStyles();

  return (
    <Button
      className={classes.loginButton}
      onClick={() => {
        void loginWithRedirect({
          redirectUri:
            (CONSOLE_ORIGIN.indexOf('local') >= 0
              ? 'https://local.cord.com:8171'
              : CONSOLE_ORIGIN) + ConsoleRoutes.LOGIN,
          // By default Auth0 will redirect to the login version of the credentials
          // form, but if screen_hint = signup it will show the signup version of the form
          // https://auth0.com/docs/authenticate/login/auth0-universal-login/new-experience
          screen_hint: type,
        });
      }}
    >
      {type === 'signup' ? 'Sign up' : 'Log In'}
    </Button>
  );
};

export default LoginButton;
