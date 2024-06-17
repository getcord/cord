import * as ReactDOM from 'react-dom';
import { Alert } from 'react-bootstrap';
import type { UUID } from 'common/types/index.ts';
import { DirectNetworkProvider } from 'external/src/context/network/DirectNetworkProvider.tsx';
import { ADMIN_SERVER_HOST } from 'common/const/Urls.ts';
import { UsersProvider } from 'external/src/context/users/UsersContext.tsx';
import { IdentityProvider } from 'external/src/context/identity/IdentityProvider.tsx';
import { FeatureFlagsProvider } from 'external/src/context/featureflags/FeatureFlagsProvider.tsx';
import { CordProvider, PresenceFacepile, Thread } from '@cord-sdk/react';
import { useCustomerIssueCordSessionTokenQuery } from 'external/src/entrypoints/admin/graphql/operations.ts';

function CustomerThreadApp({ id }: { id: UUID }) {
  const { data } = useCustomerIssueCordSessionTokenQuery({
    variables: { issueID: id },
  });
  if (!data?.customerIssueCordSessionToken) {
    return <>Nope</>;
  }
  return (
    <CordProvider clientAuthToken={data.customerIssueCordSessionToken}>
      <Alert variant="danger">You are viewing the public thread!</Alert>
      <div style={{ display: 'flex', gap: 8 }}>
        <span>who is 👀 </span>
        <PresenceFacepile location={{ issue: id }} exactMatch={true} />
      </div>
      <Thread
        threadId={id}
        location={{ issue: id }}
        style={{ width: '100%' }}
      />
    </CordProvider>
  );
}

const outerRoot = document.getElementById('embedded-customer-thread');
if (!outerRoot) {
  throw new Error('embedded-customer-thread not found');
}
const id = new URL(document.location.href).searchParams.get('id');
ReactDOM.render(
  <DirectNetworkProvider
    apiHost={ADMIN_SERVER_HOST}
    logGraphQLErrors={false}
    fetchAccessToken={false}
    token={null}
  >
    <UsersProvider>
      <IdentityProvider>
        <FeatureFlagsProvider>
          <CustomerThreadApp id={id!} />
        </FeatureFlagsProvider>
      </IdentityProvider>
    </UsersProvider>
  </DirectNetworkProvider>,
  outerRoot,
);
