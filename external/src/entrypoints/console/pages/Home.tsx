import { Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { ConsoleRoutes } from 'external/src/entrypoints/console/routes.ts';
import { CONSOLE_ORIGIN } from 'common/const/Urls.ts';

export default function Home() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();

  if (!isAuthenticated) {
    void loginWithRedirect({
      redirectUri: CONSOLE_ORIGIN + ConsoleRoutes.LOGIN,
      screen_hint: 'signup',
    });
    return null;
  }

  return <Navigate to={ConsoleRoutes.PROJECTS} replace />;
}
