import * as ReactDOM from 'react-dom';
import { DirectNetworkProvider } from 'external/src/context/network/DirectNetworkProvider.tsx';
import { ADMIN_SERVER_HOST } from 'common/const/Urls.ts';
import { IdentityProvider } from 'external/src/context/identity/IdentityProvider.tsx';
import { App } from 'external/src/entrypoints/admin/components/App.tsx';
import { FeatureFlagsProvider } from 'external/src/context/featureflags/FeatureFlagsProvider.tsx';
import { UsersProvider } from 'external/src/context/users/UsersContext.tsx';
import { initSentry } from 'external/src/logging/sentry/react.ts';
import { JssInjector } from 'external/src/common/JssInjector.tsx';

initSentry();
const rootElement = document.createElement('div');
document.body.appendChild(rootElement);
ReactDOM.render(
  <JssInjector rootElement={rootElement} resetCss={false}>
    <DirectNetworkProvider
      apiHost={ADMIN_SERVER_HOST}
      logGraphQLErrors={false}
      fetchAccessToken={false}
      token={null}
    >
      <UsersProvider>
        <IdentityProvider>
          <FeatureFlagsProvider>
            <App />
          </FeatureFlagsProvider>
        </IdentityProvider>
      </UsersProvider>
    </DirectNetworkProvider>
  </JssInjector>,

  rootElement,
);
