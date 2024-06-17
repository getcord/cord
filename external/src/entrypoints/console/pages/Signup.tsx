import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';
import { CONSOLE_ORIGIN } from 'common/const/Urls.ts';
import { ConsoleRoutes } from 'external/src/entrypoints/console/routes.ts';

// This page should just redirect straight to auth0
export function Signup() {
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  if (!isAuthenticated) {
    void loginWithRedirect({
      redirectUri: CONSOLE_ORIGIN + ConsoleRoutes.LOGIN,
      screen_hint: 'signup',
    });
    return null;
  }

  return <Navigate replace to={ConsoleRoutes.HOME}></Navigate>;
}
