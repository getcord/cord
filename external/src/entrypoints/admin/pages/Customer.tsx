import { Helmet } from 'react-helmet';
import { Spinner, Tabs, Tab } from 'react-bootstrap';
import type { UUID } from 'common/types/index.ts';
import { useCustomerQuery } from 'external/src/entrypoints/admin/graphql/operations.ts';
import TabConsoleUsers from 'external/src/entrypoints/admin/components/CustomerUserCard.tsx';
import { useUnsafeParams } from 'external/src/effects/useUnsafeParams.ts';

import TabBilling from 'external/src/entrypoints/admin/components/TabBilling.tsx';
import { TabApplications } from 'external/src/entrypoints/admin/components/TabApplications.tsx';
import { TabIssues } from 'external/src/entrypoints/admin/components/TabIssues.tsx';
import { TabGeneralSettings } from 'external/src/entrypoints/admin/components/TabGeneralSettings.tsx';

export function Customer() {
  const { id } = useUnsafeParams<{ id: UUID }>();
  const {
    data,
    loading,
    refetch: refetchCustomer,
  } = useCustomerQuery({ variables: { id } });

  if (loading || !data?.customer) {
    return <Spinner animation={'border'} />;
  }

  return (
    <>
      <Helmet>
        <title>Cord Admin - Customer</title>
      </Helmet>
      <Tabs defaultActiveKey="general">
        <Tab eventKey="general" title="General">
          <TabGeneralSettings customerData={data.customer} />
        </Tab>
        <Tab eventKey="billing" title="Billing">
          <TabBilling
            customer={data.customer}
            refetch={async () => {
              await refetchCustomer();
            }}
          />
        </Tab>
        <Tab eventKey="applications" title="Applications">
          <TabApplications customerID={id} />
        </Tab>
        <Tab eventKey="console_users" title="Console users">
          <TabConsoleUsers id={id} />
        </Tab>
        <Tab eventKey="issues" title="Issues">
          <TabIssues customerID={id} />
        </Tab>
      </Tabs>
    </>
  );
}
