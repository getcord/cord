import { useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from 'react-bootstrap';

import type { UUID } from 'common/types/index.ts';
import { DataTableQueries } from 'common/types/index.ts';
import { DataTable } from 'external/src/entrypoints/admin/components/DataTable.tsx';
import { useLazySelectQuery } from 'external/src/entrypoints/admin/graphql/operations.ts';

export function Admins() {
  const [executeSQL] = useLazySelectQuery({
    onCompleted: () => window.location.reload(),
  });

  const setUserAdmin = useCallback(
    (id: UUID, admin: boolean) =>
      executeSQL({
        variables: {
          query: DataTableQueries.SET_ADMIN,
          parameters: { id, admin },
        },
      }),
    [executeSQL],
  );

  return (
    <>
      <Helmet>
        <title>Cord Admin - Admin Users</title>
      </Helmet>
      <DataTable
        title="Admin Users"
        query={DataTableQueries.ADMIN_USERS}
        actions={(user) =>
          user.admin ? (
            <Button
              variant="danger"
              onClick={() => void setUserAdmin(user.id, false)}
            >
              Remove Admin
            </Button>
          ) : (
            <Button
              variant="success"
              onClick={() => void setUserAdmin(user.id, true)}
            >
              Make Admin
            </Button>
          )
        }
      />
    </>
  );
}
