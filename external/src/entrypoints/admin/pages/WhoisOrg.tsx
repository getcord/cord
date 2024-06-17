import { useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from 'react-bootstrap';
import { useUnsafeParams } from 'external/src/effects/useUnsafeParams.ts';

import type { UUID } from 'common/types/index.ts';
import { DataTableQueries } from 'common/types/index.ts';
import { ObjectInfo } from 'external/src/entrypoints/admin/components/ObjectInfo.tsx';
import { AdminRoutes } from 'external/src/entrypoints/admin/routes.ts';
import { useToggleInternalFlagOnOrgMutation } from 'external/src/entrypoints/admin/graphql/operations.ts';

export function WhoisOrg() {
  const { id } = useUnsafeParams<{ id: UUID }>();

  const [mutateInternal] = useToggleInternalFlagOnOrgMutation();
  const toggleInternalFlag = useCallback(async () => {
    await mutateInternal({
      variables: {
        orgID: id,
      },
    });
    window.location.reload();
  }, [id, mutateInternal]);

  return (
    <>
      <Helmet>
        <title>Cord Admin - What the Org</title>
      </Helmet>

      <ObjectInfo
        query={DataTableQueries.ORG_DETAILS}
        parameters={{ id }}
        dynamicLinks={{
          platformApplicationID: AdminRoutes.WHOIS + '/application',
          memberIDs: AdminRoutes.WHOIS + '/user',
        }}
        elementBelowTable={
          <Button onClick={() => void toggleInternalFlag()}>
            Toggle internal flag
          </Button>
        }
      />
    </>
  );
}
