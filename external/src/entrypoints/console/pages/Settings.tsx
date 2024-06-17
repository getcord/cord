import { Helmet } from 'react-helmet';

import { Navigate, Route, Routes } from 'react-router-dom';
import Main from 'external/src/entrypoints/console/ui/Main.tsx';
import Header from 'external/src/entrypoints/console/ui/Header.tsx';
import { SettingsCustomer } from 'external/src/entrypoints/console/pages/SettingsCustomer.tsx';
import { SubNavigation } from 'external/src/entrypoints/console/components/SubNavigation.tsx';
import { ConsoleSettingsRoutes } from 'external/src/entrypoints/console/routes.ts';
import { SettingsUser } from 'external/src/entrypoints/console/pages/SettingsUser.tsx';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { UserManagement } from 'external/src/entrypoints/console/pages/UserManagement.tsx';
import { Billing } from 'external/src/entrypoints/console/pages/Billing.tsx';

const navigationItems = {
  user: 'User',
  customer: 'Customer',
  seats: 'Seats',
  billing: 'Billing',
};

export function Settings() {
  const isBillingInConsoleEnabled = useFeatureFlag(
    FeatureFlags.BILLING_ENABLED_IN_CONSOLE,
  );

  return (
    <Main header={<Header text="Settings" />}>
      <Helmet>
        <title>Settings</title>
      </Helmet>
      <SubNavigation navigationItems={navigationItems} />
      <div>
        <Routes>
          <Route
            index
            element={
              <Navigate replace to={ConsoleSettingsRoutes.SETTINGS_USER} />
            }
          />
          <Route
            path={ConsoleSettingsRoutes.SETTINGS_USER}
            element={<SettingsUser />}
          />
          <Route
            path={ConsoleSettingsRoutes.SETTINGS_CUSTOMER}
            element={<SettingsCustomer />}
          />
          <Route
            path={ConsoleSettingsRoutes.SETTINGS_SEATS}
            element={<UserManagement />}
          />
          {isBillingInConsoleEnabled && (
            <Route
              path={ConsoleSettingsRoutes.SETTINGS_BILLING}
              element={<Billing />}
            />
          )}
        </Routes>
      </div>
    </Main>
  );
}
