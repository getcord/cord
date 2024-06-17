import { Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useMemo } from 'react';
import {
  ConsoleApplicationRoutes,
  ConsoleApplicationSettingsRoutes,
  getBaseApplicationURL,
} from 'external/src/entrypoints/console/routes.ts';
import ApplicationRedirectURIs from 'external/src/entrypoints/console/pages/ApplicationRedirectURIs.tsx';
import ApplicationGeneral from 'external/src/entrypoints/console/pages/ApplicationGeneral.tsx';
import ApplicationCustomNUX from 'external/src/entrypoints/console/pages/ApplicationCustomNUX.tsx';
import { ApplicationSupportChat } from 'external/src/entrypoints/console/pages/ApplicationSupportChat.tsx';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { ApplicationOrgs } from 'external/src/entrypoints/console/pages/ApplicationOrgs.tsx';
import ApplicationAdvanced from 'external/src/entrypoints/console/pages/ApplicationAdvanced.tsx';
import { ApplicationEvents } from 'external/src/entrypoints/console/pages/ApplicationEvents.tsx';
import { SubNavigation } from 'external/src/entrypoints/console/components/SubNavigation.tsx';
import Main from 'external/src/entrypoints/console/ui/Main.tsx';
import Header from 'external/src/entrypoints/console/ui/Header.tsx';
import ApplicationEmailNotifications from 'external/src/entrypoints/console/pages/ApplicationEmailNotifications.tsx';
import { useUnsafeParams } from 'external/src/effects/useUnsafeParams.ts';
import type { UUID } from 'common/types/index.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';

const getApplicationNavigationItems = (
  supportChatEnabled: boolean,
  showEvents: boolean,
) => ({
  general: 'General',
  'redirect-uris': 'Redirect URIs',
  ...(showEvents ? { events: 'Events Webhook' } : {}),
  'email-notifications': 'Email Notifications',
  'new-user-experience': 'New User Experience',
  advanced: 'Advanced',
  ...(supportChatEnabled ? { 'support-chat': 'Support Chat' } : {}),
  ...(showEvents ? { events: 'Events' } : {}),
});

export default function ApplicationSettings() {
  const { id: idFromParams } = useUnsafeParams<{
    id: UUID;
  }>();

  const supportChatEnabled = useFeatureFlag(FeatureFlags.SUPPORT_CHAT_ENABLED);
  const showEvents = useFeatureFlag(FeatureFlags.SHOW_EVENTS_TAB_IN_CONSOLE);

  const navigationItems = useMemo(
    () =>
      getApplicationNavigationItems(
        supportChatEnabled,

        showEvents,
      ),
    [supportChatEnabled, showEvents],
  );

  const { application } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );

  return (
    <Main
      header={<Header text={`${application?.name} configuration`} />}
      withoutDivider
    >
      <Helmet>
        <title>{application?.name ?? 'Project'} Configuration</title>
      </Helmet>
      <SubNavigation navigationItems={navigationItems} />
      <div>
        <Routes>
          <Route
            path="new-user-experience"
            element={<ApplicationCustomNUX />}
          />
          <Route
            path={ConsoleApplicationSettingsRoutes.APPLICATION_ADVANCED}
            element={<ApplicationAdvanced />}
          />
          {supportChatEnabled && (
            <Route
              path={ConsoleApplicationSettingsRoutes.APPLICATION_SUPPORT_CHAT}
              element={<ApplicationSupportChat />}
            />
          )}
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
            index
            element={
              <Navigate
                replace
                to={ConsoleApplicationSettingsRoutes.APPLICATION_GENERAL}
              />
            }
          />
          <Route
            path={ConsoleApplicationSettingsRoutes.APPLICATION_GENERAL}
            element={<ApplicationGeneral />}
          />
          <Route
            path={ConsoleApplicationSettingsRoutes.APPLICATION_REDIRECT_URIS}
            element={<ApplicationRedirectURIs />}
          />
          <Route
            path={
              ConsoleApplicationSettingsRoutes.APPLICATION_EMAIL_NOTIFICATIONS
            }
            element={<ApplicationEmailNotifications />}
          />
          {showEvents && (
            <Route
              path={ConsoleApplicationSettingsRoutes.APPLICATION_EVENTS}
              element={<ApplicationEvents />}
            />
          )}
        </Routes>
      </div>
    </Main>
  );
}
