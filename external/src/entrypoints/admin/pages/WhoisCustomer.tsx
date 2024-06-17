import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import type { UUID } from 'common/types/index.ts';
import { DataTableQueries } from 'common/types/index.ts';
import { ObjectInfo } from 'external/src/entrypoints/admin/components/ObjectInfo.tsx';
import { useUnsafeParams } from 'external/src/effects/useUnsafeParams.ts';

export function WhoisCustomer() {
  const { id } = useUnsafeParams<{ id: UUID }>();
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Cord Admin - What Appened</title>
      </Helmet>

      <ObjectInfo
        query={DataTableQueries.CUSTOMER_DETAILS}
        parameters={{ id }}
      />
      <Button
        onClick={() => {
          navigate('/customers/' + id);
        }}
      >
        More Info
      </Button>
    </>
  );
}
