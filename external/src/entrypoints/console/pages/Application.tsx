import { Routes, Route, Navigate } from 'react-router-dom';

import { Helmet } from 'react-helmet';
import { CircularProgress } from '@mui/material';
import { useEffect } from 'react';
import {
  ConsoleApplicationRoutes,
  getBaseApplicationURL,
} from 'external/src/entrypoints/console/routes.ts';
import ApplicationSettings from 'external/src/entrypoints/console/pages/ApplicationSettings.tsx';
import ApplicationGettingStarted from 'external/src/entrypoints/console/pages/ApplicationGettingStarted.tsx';
import { ApplicationThreads } from 'external/src/entrypoints/console/pages/ApplicationThreads.tsx';
import { ApplicationMessages } from 'external/src/entrypoints/console/pages/ApplicationMessages.tsx';
import { ApplicationUsers } from 'external/src/entrypoints/console/pages/ApplicationUsers.tsx';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';
import { ApplicationOrgs } from 'external/src/entrypoints/console/pages/ApplicationOrgs.tsx';
import { ApplicationOrg } from 'external/src/entrypoints/console/pages/ApplicationOrg.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useUnsafeParams } from 'external/src/effects/useUnsafeParams.ts';
import type { UUID } from 'common/types/index.ts';

export default function Application() {
  return (
    <>
      <Helmet>
        <title>Project</title>
      </Helmet>
      <ApplicationRoutes />
    </>
  );
}

function ApplicationRoutes() {
  const { application, id, setApplicationID } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );

  const { id: idFromParams } = useUnsafeParams<{
    id: UUID;
  }>();

  useEffect(() => {
    if (idFromParams !== id) {
      setApplicationID(idFromParams);
    }
  }, [id, idFromParams, setApplicationID]);

  if (!application) {
    return <CircularProgress />;
  }

  return (
    <Routes>
      <Route
        path={`${ConsoleApplicationRoutes.APPLICATION_SETTINGS}/*`}
        element={<ApplicationSettings />}
      />
      <Route
        path={ConsoleApplicationRoutes.APPLICATION_GETTING_STARTED}
        element={<ApplicationGettingStarted />}
      />
      <Route
        path={ConsoleApplicationRoutes.APPLICATION_THREADS}
        element={<ApplicationThreads />}
      />
      <Route
        path={ConsoleApplicationRoutes.APPLICATION_THREAD_MESSAGES}
        element={<ApplicationMessages />}
      />
      <Route
        path={ConsoleApplicationRoutes.APPLICATION_USERS}
        element={<ApplicationUsers />}
      />
      <Route
        path={ConsoleApplicationRoutes.APPLICATION_ORGS}
        element={<ApplicationOrgs />}
      />
      <Route
        path={ConsoleApplicationRoutes.APPLICATION_DEPRECATED_ORGS}
        element={
          <Navigate
            to={`${getBaseApplicationURL(idFromParams)}/${
              ConsoleApplicationRoutes.APPLICATION_ORGS
            }`}
            replace
          />
        }
      />
      <Route
        path={ConsoleApplicationRoutes.APPLICATION_ORG_USERS}
        element={<ApplicationOrg />}
      />
      <Route
        path={ConsoleApplicationRoutes.APPLICATION_DEPRECATED_ORG_USERS}
        element={
          <Navigate
            to={`${getBaseApplicationURL(idFromParams)}/${
              ConsoleApplicationRoutes.APPLICATION_ORG_USERS
            }`}
            replace
          />
        }
      />
      <Route
        path={ConsoleApplicationRoutes.APPLICATION_MESSAGES}
        element={<ApplicationMessages />}
      />
      <Route
        path="*"
        element={
          <Navigate
            to={ConsoleApplicationRoutes.APPLICATION_SETTINGS}
            replace
          />
        }
      />
    </Routes>
  );
}
