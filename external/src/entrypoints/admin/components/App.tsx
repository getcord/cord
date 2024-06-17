import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { createUseStyles } from 'react-jss';

import { CordProvider, PresenceObserver } from '@cord-sdk/react';
import { AdminRoutes } from 'external/src/entrypoints/admin/routes.ts';
import { Admins } from 'external/src/entrypoints/admin/pages/Admins.tsx';
import { Whois } from 'external/src/entrypoints/admin/pages/Whois.tsx';
import { WhoisApp } from 'external/src/entrypoints/admin/pages/WhoisApp.tsx';
import { WhoisOrg } from 'external/src/entrypoints/admin/pages/WhoisOrg.tsx';
import { WhoisUser } from 'external/src/entrypoints/admin/pages/WhoisUser.tsx';
import { WhoisMessage } from 'external/src/entrypoints/admin/pages/WhoisMessage.tsx';
import { NotFound } from 'external/src/entrypoints/admin/pages/404.tsx';
import { APP_ORIGIN } from 'common/const/Urls.ts';
import { AdminSidebar } from 'external/src/entrypoints/admin/components/AdminSidebar.tsx';
import { Navigation } from 'external/src/entrypoints/admin/components/Navigation.tsx';
import { Applications } from 'external/src/entrypoints/admin/pages/Applications.tsx';
import { Heimdall } from 'external/src/entrypoints/admin/pages/Heimdall.tsx';
import { Threads } from 'external/src/entrypoints/admin/pages/Threads.tsx';
import { HeimdallKey } from 'external/src/entrypoints/admin/pages/HeimdallKey.tsx';
import { Deploys } from 'external/src/entrypoints/admin/pages/Deploys.tsx';
import { Application } from 'external/src/entrypoints/admin/pages/Application.tsx';
import { useCordSessionTokenQuery } from 'external/src/entrypoints/admin/graphql/operations.ts';
import { CordContextSetter } from 'external/src/entrypoints/admin/components/ContextRoute.tsx';
import type { UUID } from 'common/types/index.ts';

import { Tools } from 'external/src/entrypoints/admin/pages/Tools.tsx';
import { Customers } from 'external/src/entrypoints/admin/pages/Customers.tsx';
import { Customer } from 'external/src/entrypoints/admin/pages/Customer.tsx';
import { WhoisCustomer } from 'external/src/entrypoints/admin/pages/WhoisCustomer.tsx';
import { GoRedirects } from 'external/src/entrypoints/admin/pages/GoRedirects.tsx';
import { GoRedirect } from 'external/src/entrypoints/admin/pages/GoRedirect.tsx';
import { AutomatedTestsToken } from 'external/src/entrypoints/admin/pages/AutomatedTestsToken.tsx';
import { Issues } from 'external/src/entrypoints/admin/pages/Issues.tsx';
import { Issue } from 'external/src/entrypoints/admin/pages/Issue.tsx';
import { BroadcastToCustomers } from 'external/src/entrypoints/admin/pages/BroadcastToCustomers.tsx';
import { WhoisThread } from 'external/src/entrypoints/admin/pages/WhoisThread.tsx';
import { WhoisIdSearch } from 'external/src/entrypoints/admin/pages/WhoisIdSearch.tsx';
import { ParseQuery } from 'external/src/entrypoints/admin/pages/ParseQuery.tsx';

const useStyles = createUseStyles({
  container: {
    padding: '16px',
  },
});

export function App() {
  const classes = useStyles();

  const { data } = useCordSessionTokenQuery();
  const cordSessionToken = data?.cordSessionToken;

  return (
    <CordProvider
      clientAuthToken={cordSessionToken}
      cordScriptUrl={`${APP_ORIGIN}/sdk/v1/sdk.latest.js`}
    >
      <BrowserRouter>
        <PresenceObserver observeDocument={true} durable={true} />
        <Navigation />
        <AdminSidebar />
        <div className={classes.container}>
          <Routes>
            <Route
              path={AdminRoutes.HOME}
              element={
                <CordContextSetter context={{ page: 'home' }}>
                  <Tools />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.ADMIN_USERS}
              element={
                <CordContextSetter context={{ page: 'admins' }}>
                  <Admins />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.WHOIS}
              element={
                <CordContextSetter context={{ page: 'whois' }}>
                  <Whois />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.WHOIS_APP}
              element={
                <CordContextSetter
                  context={(params: { id: UUID }) => ({
                    page: 'whois/application',
                    applicationID: params.id,
                  })}
                >
                  <WhoisApp />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.WHOIS_ORG}
              element={
                <CordContextSetter
                  context={(params: { id: UUID }) => ({
                    page: 'whois/org',
                    orgID: params.id,
                  })}
                >
                  <WhoisOrg />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.WHOIS_USER}
              element={
                <CordContextSetter
                  context={(params: { id: UUID }) => ({
                    page: 'whois/user',
                    userID: params.id,
                  })}
                >
                  <WhoisUser />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.WHOIS_MESSAGE}
              element={
                <CordContextSetter
                  context={(params: { id: UUID }) => ({
                    page: 'whois/message',
                    messageID: params.id,
                  })}
                >
                  <WhoisMessage />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.WHOIS_CUSTOMER}
              element={
                <CordContextSetter
                  context={(params: { id: UUID }) => ({
                    page: 'whois/customer',
                    messageID: params.id,
                  })}
                >
                  <WhoisCustomer />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.WHOIS_THREAD}
              element={
                <CordContextSetter
                  context={(params: { id: UUID }) => ({
                    page: 'whois/thread',
                    threadID: params.id,
                  })}
                >
                  <WhoisThread />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.WHOIS_ID_SEARCH}
              element={
                <CordContextSetter
                  context={(params: { id: UUID }) => ({
                    page: 'whois/idsearch',
                    searchID: params.id,
                  })}
                >
                  <WhoisIdSearch />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.APPLICATIONS}
              element={
                <CordContextSetter context={{ page: 'applications' }}>
                  <Applications />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.APPLICATION}
              element={
                <CordContextSetter
                  context={(params: { id: UUID }) => ({
                    page: 'applications',
                    applicationID: params.id,
                  })}
                >
                  <Application />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.CUSTOMERS}
              element={
                <CordContextSetter context={{ page: 'customers' }}>
                  <Customers />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.CUSTOMER}
              element={
                <CordContextSetter
                  context={(params: { id: UUID }) => ({
                    page: 'customers',
                    customerID: params.id,
                  })}
                >
                  <Customer />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.ISSUES}
              element={
                <CordContextSetter context={{ page: 'issues' }}>
                  <Issues />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.ISSUE}
              element={
                <CordContextSetter
                  context={(params: { id: UUID }) => ({
                    issue: params.id,
                  })}
                >
                  <Issue />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.HEIMDALL}
              element={
                <CordContextSetter context={{ page: 'heimdall' }}>
                  <Heimdall />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.HEIMDALL_KEY}
              element={
                <CordContextSetter
                  context={(params: { key: string }) => ({
                    page: 'heimdall',
                    providerID: params.key,
                  })}
                >
                  <HeimdallKey />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.THREADS}
              element={
                <CordContextSetter context={{ page: 'threads' }}>
                  <Threads />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.BROADCAST_TO_CUSTOMERS}
              element={
                <CordContextSetter context={{ page: 'broadcast' }}>
                  <BroadcastToCustomers />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.DEPLOYS}
              element={
                <CordContextSetter context={{ page: 'deploys' }}>
                  <Deploys />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.GO}
              element={
                <CordContextSetter context={{ page: 'go' }}>
                  <GoRedirects />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.GO_EDIT}
              element={
                <CordContextSetter
                  context={(params: { name: string }) => ({
                    page: 'go_edit',
                    name: params.name,
                  })}
                >
                  <GoRedirect />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.AUTOMATED_TESTS_TOKEN}
              element={
                <CordContextSetter context={{ page: 'automated_tests_token' }}>
                  <AutomatedTestsToken />
                </CordContextSetter>
              }
            />
            <Route
              path={AdminRoutes.PARSE_QUERY}
              element={
                <CordContextSetter context={{ page: 'parse_query' }}>
                  <ParseQuery />
                </CordContextSetter>
              }
            />
            <Route
              element={
                <CordContextSetter context={{ page: 'notfound' }}>
                  <NotFound />
                </CordContextSetter>
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
    </CordProvider>
  );
}
