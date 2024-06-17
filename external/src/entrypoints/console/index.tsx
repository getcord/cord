import * as ReactDOM from 'react-dom';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { StylesProvider } from '@material-ui/core';
import { AUTH0_CLIENT_ID } from 'common/const/Ids.ts';
import {
  AUTH0_CUSTOM_LOGIN_DOMAIN,
  CONSOLE_ORIGIN,
} from 'common/const/Urls.ts';
import {
  ConsoleRoutes,
  ConsoleSettingsRoutes,
  projectRedirect,
} from 'external/src/entrypoints/console/routes.ts';
import { NotFound } from 'external/src/entrypoints/console/pages/404.tsx';
import Applications from 'external/src/entrypoints/console/pages/Applications.tsx';
import Application from 'external/src/entrypoints/console/pages/Application.tsx';
import ProtectedRoute from 'external/src/entrypoints/console/components/ProtectedRoute.tsx';
import { ConsoleAuthContextProvider } from 'external/src/entrypoints/console/contexts/ConsoleAuthContextProvider.tsx';
import Login from 'external/src/entrypoints/console/pages/Login.tsx';
import { Colors } from 'common/const/Colors.ts';
import { AUTH0_AUDIENCE } from 'external/src/entrypoints/console/const.ts';
import { FeatureFlagsProvider } from 'external/src/context/featureflags/FeatureFlagsProvider.tsx';
import { CustomerInfoProvider } from 'external/src/entrypoints/console/contexts/CustomerInfoProvider.tsx';
import { Issues } from 'external/src/entrypoints/console/pages/Issues.tsx';
import { Issue } from 'external/src/entrypoints/console/pages/Issue.tsx';
import { CordApp } from 'external/src/entrypoints/console/components/CordApp.tsx';
import { DisabledApplicationProvider } from 'external/src/context/embed/ApplicationProvider.tsx';
import { PageContext } from 'external/src/context/page/PageContext.ts';
import PreferenceContextProvider from 'common/page_context/PreferenceContext.tsx';

import { PageUrlProvider } from 'external/src/context/page/PageUrlProvider.tsx';
import { InjectDynamicStylesProvider } from 'external/src/common/JssInjector.tsx';
import { LoggedOutPreferencesProvider } from 'external/src/context/preferences/LoggedOutPreferencesProvider.tsx';
import { LightweightErrorHandler } from 'external/src/logging/LightweightErrorHandler.tsx';
import { DefaultConfigurationProvider } from 'external/src/context/config/DefaultConfigurationProvider.tsx';
import { Signup } from 'external/src/entrypoints/console/pages/Signup.tsx';
import Home from 'external/src/entrypoints/console/pages/Home.tsx';
import Layout from 'external/src/entrypoints/console/components/Layout.tsx';
import { Settings } from 'external/src/entrypoints/console/pages/Settings.tsx';
import { ConsoleSetupProvider } from 'external/src/entrypoints/console/contexts/ConsoleSetupProvider.tsx';

const rootElement = document.createElement('div');
document.body.style.backgroundColor = Colors.WHITE;
document.body.appendChild(rootElement);
ReactDOM.render(
  <StylesProvider injectFirst>
    <InjectDynamicStylesProvider>
      <Auth0Provider
        domain={AUTH0_CUSTOM_LOGIN_DOMAIN}
        clientId={AUTH0_CLIENT_ID}
        audience={AUTH0_AUDIENCE}
        useRefreshTokens
        redirectUri={CONSOLE_ORIGIN + ConsoleRoutes.LOGIN}
      >
        <ConsoleAuthContextProvider>
          <LightweightErrorHandler>
            {/* Calling useApplicationSpecificationsQuery here won't return any data,
                  hence why we disable the ApplicationProvider altogether. */}
            <DisabledApplicationProvider>
              <PageContext.Provider
                value={{
                  data: { console: true },
                  providerID: null,
                }}
              >
                <PageUrlProvider>
                  {/* TODO this should be PreferencesProvider. 
                  However, using that throws `Schema is not configured for subscriptions.` */}
                  <LoggedOutPreferencesProvider>
                    <FeatureFlagsProvider>
                      <CustomerInfoProvider>
                        <PreferenceContextProvider>
                          <DefaultConfigurationProvider>
                            <CordApp>
                              <ConsoleSetupProvider>
                                <BrowserRouter>
                                  <Layout title="Cord Console">
                                    <Routes>
                                      <Route
                                        path={ConsoleRoutes.HOME}
                                        element={<Home />}
                                      />
                                      <Route
                                        path={ConsoleRoutes.PROJECTS}
                                        element={
                                          <ProtectedRoute>
                                            <Applications />
                                          </ProtectedRoute>
                                        }
                                      />
                                      <Route
                                        path={`${ConsoleRoutes.SETTINGS}/*`}
                                        element={
                                          <ProtectedRoute>
                                            <Settings />
                                          </ProtectedRoute>
                                        }
                                      />
                                      <Route
                                        path={`${ConsoleRoutes.PROJECT}/*`}
                                        element={
                                          <ProtectedRoute>
                                            <Application />
                                          </ProtectedRoute>
                                        }
                                      />
                                      <Route
                                        path={ConsoleRoutes.ISSUES}
                                        element={
                                          <ProtectedRoute>
                                            <Issues />
                                          </ProtectedRoute>
                                        }
                                      />
                                      <Route
                                        path={ConsoleRoutes.ISSUE}
                                        element={
                                          <ProtectedRoute>
                                            <Issue />
                                          </ProtectedRoute>
                                        }
                                      />
                                      <Route
                                        path={ConsoleRoutes.LOGIN}
                                        element={<Login />}
                                      />
                                      <Route
                                        path={ConsoleRoutes.SIGNUP}
                                        element={<Signup />}
                                      />
                                      {/* Redirects */}
                                      <Route
                                        path={'/billing'}
                                        element={
                                          <Navigate
                                            to={`/settings/${ConsoleSettingsRoutes.SETTINGS_BILLING}`}
                                            replace
                                          />
                                        }
                                      />
                                      <Route
                                        path={'/usermanagement'}
                                        element={
                                          <Navigate
                                            to={`/settings/${ConsoleSettingsRoutes.SETTINGS_SEATS}`}
                                            replace
                                          />
                                        }
                                      />
                                      <Route
                                        path={'/applications'}
                                        element={
                                          <Navigate
                                            to={`${ConsoleRoutes.PROJECTS}`}
                                            replace
                                          />
                                        }
                                      />
                                      <Route
                                        path={'/applications/*'}
                                        element={
                                          <Navigate
                                            to={`${projectRedirect()}`}
                                            replace
                                          />
                                        }
                                      />
                                      <Route element={<NotFound />} />
                                    </Routes>
                                  </Layout>
                                </BrowserRouter>
                              </ConsoleSetupProvider>
                            </CordApp>
                          </DefaultConfigurationProvider>
                        </PreferenceContextProvider>
                      </CustomerInfoProvider>
                    </FeatureFlagsProvider>
                  </LoggedOutPreferencesProvider>
                </PageUrlProvider>
              </PageContext.Provider>
            </DisabledApplicationProvider>
          </LightweightErrorHandler>
        </ConsoleAuthContextProvider>
      </Auth0Provider>
    </InjectDynamicStylesProvider>
  </StylesProvider>,
  rootElement,
);
