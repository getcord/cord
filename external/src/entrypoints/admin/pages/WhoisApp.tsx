import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import type { UUID } from 'common/types/index.ts';
import { DataTableQueries } from 'common/types/index.ts';
import { ObjectInfo } from 'external/src/entrypoints/admin/components/ObjectInfo.tsx';
import { useUnsafeParams } from 'external/src/effects/useUnsafeParams.ts';
import { AdminRoutes } from 'external/src/entrypoints/admin/routes.ts';

export function WhoisApp() {
  const { id } = useUnsafeParams<{ id: UUID }>();
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Cord Admin - What Appened</title>
      </Helmet>

      <ObjectInfo
        query={DataTableQueries.APP_DETAILS}
        parameters={{ id }}
        dynamicLinks={{
          customerID: AdminRoutes.WHOIS + '/customer',
        }}
      />
      <Button
        onClick={() => {
          navigate('/applications/' + id);
        }}
      >
        More Info
      </Button>
    </>
  );
}
